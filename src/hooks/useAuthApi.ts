import { useCallback } from 'react';
import { apiRequest, apiUrl } from '@/lib/api';
import { useTaskStore } from '@/store/useTaskStore';
import type { AuthEnvelope, Session } from '@/types/task';

let refreshInFlight: Promise<Session> | null = null;

export function useAuthApi() {
  const refresh = useCallback(async (): Promise<Session> => {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = apiRequest<AuthEnvelope>('/api/v1/auth/refresh', {
      method: 'POST',
    }).then((response) => {
      const session: Session = { token: response.data.token, user: response.data.user };
      useTaskStore.getState().setSession(session);
      return session;
    }).finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  }, []);

  const logout = useCallback(async () => {
    const token = useTaskStore.getState().session?.token;
    try {
      if (token) await apiRequest<void>('/api/v1/auth/logout', { method: 'POST', token });
    } finally {
      useTaskStore.getState().clearSession();
    }
  }, []);

  const startGoogleSignIn = useCallback(() => {
    window.location.assign(apiUrl('/api/v1/auth/google'));
  }, []);

  return { refresh, logout, startGoogleSignIn };
}
