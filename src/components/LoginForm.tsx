import { Button } from '@/components/ui/button';
import { useAuthApi } from '@/hooks/useAuthApi';

export function LoginForm() {
  const { startGoogleSignIn } = useAuthApi();

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full space-y-5 rounded-xl border border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div>
          <h1 className="text-xl font-bold">OYA!</h1>
          <p className="mt-1 text-sm text-neutral-600">Sign in with your approved Google account to manage boards and tasks.</p>
        </div>
        <Button type="button" onClick={startGoogleSignIn} className="w-full">
          Continue with Google
        </Button>
      </section>
    </main>
  );
}
