import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { useAuthApi } from '../useAuthApi';
import { useTaskStore } from '@/store/useTaskStore';
import { session } from '@/test/mocks/fixtures';
import { server } from '@/test/mocks/server';

describe('useAuthApi', () => {
  it('stores the session returned by refresh without persisting it locally', async () => {
    const { result } = renderHook(() => useAuthApi());
    await act(async () => { await result.current.refresh(); });
    expect(useTaskStore.getState().session).toEqual(session);
    expect(localStorage.getItem('oya_session')).toBeNull();
  });

  it('shares one in-flight refresh request', async () => {
    let refreshCalls = 0;
    server.use(http.post('*/api/v1/auth/refresh', async () => {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return HttpResponse.json({ data: { ...session, token_type: 'Bearer' } });
    }));

    const { result } = renderHook(() => useAuthApi());
    const firstRefresh = result.current.refresh();
    const secondRefresh = result.current.refresh();

    await act(async () => {
      await Promise.all([firstRefresh, secondRefresh]);
    });

    expect(refreshCalls).toBe(1);
  });

  it('does not create a session when refresh is rejected', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => HttpResponse.json({ error: { code: 'unauthorized', message: 'session expired' } }, { status: 401 })));
    const { result } = renderHook(() => useAuthApi());
    await expect(result.current.refresh()).rejects.toThrow('session expired');
    expect(useTaskStore.getState().session).toBeNull();
  });

  it('revokes the server session before clearing local state', async () => {
    useTaskStore.getState().setSession(session);
    const { result } = renderHook(() => useAuthApi());
    await act(async () => { await result.current.logout(); });
    expect(useTaskStore.getState().session).toBeNull();
  });

  it('redirects to the backend to begin Google sign-in', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    const { result } = renderHook(() => useAuthApi());
    result.current.startGoogleSignIn();
    expect(assign).toHaveBeenCalledWith('/api/v1/auth/google');
    vi.unstubAllGlobals();
  });
});
