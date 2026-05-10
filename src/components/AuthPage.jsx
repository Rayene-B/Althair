import { useState } from 'react';
import { Lock, Mail, Sparkles } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import TextInput from './TextInput';
import { login, signup } from '../utils/api';
import backgroundMain from '../../BackgroundMain.png';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const auth = mode === 'signup'
        ? await signup(email, password, confirmPassword)
        : await login(email, password);
      onAuthenticated(auth);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <div className="page-background" style={{ backgroundImage: `url(${backgroundMain})` }} />
      <div className="page-background-overlay" />
      <main className="relative z-10 grid min-h-screen place-items-center px-5 py-10">
        <Card className="surface-card w-full max-w-md border-cyan-200/18">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[8px] border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
              <Sparkles size={22} />
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Althair</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs text-white/62"><Mail size={14} /> Email</span>
              <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs text-white/62"><Lock size={14} /> Password</span>
              <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </label>
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs text-white/62"><Lock size={14} /> Confirm password</span>
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </label>
            )}

            {error && <p className="rounded-[8px] border border-amber-300/18 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full disabled:cursor-not-allowed disabled:opacity-50">
              {isLoading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/46"
            title="Google login needs OAuth credentials and a production redirect URI."
            disabled
          >
            Continue with Google unavailable locally
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === 'signup' ? 'login' : 'signup'));
              setError('');
            }}
            className="mt-5 w-full text-sm text-cyan-100/78 hover:text-cyan-100"
          >
            {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
          </button>
        </Card>
      </main>
    </div>
  );
}
