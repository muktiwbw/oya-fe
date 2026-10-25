import { useEffect, useState } from 'react';
import { TaskBoard } from '@/components/TaskBoard';
import { LoginForm } from '@/components/LoginForm';
import { useAuthApi } from '@/hooks/useAuthApi';
import { useTaskStore } from '@/store/useTaskStore';

export function App() {
  const session = useTaskStore((state) => state.session);
  const { refresh } = useAuthApi();
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    void refresh().catch(() => undefined).finally(() => setIsRestoringSession(false));
  }, [refresh]);

  if (isRestoringSession) {
    return <main aria-busy="true" className="flex min-h-screen items-center justify-center">Restoring session…</main>;
  }

  return session ? <TaskBoard /> : <LoginForm />;
}

export default App;
