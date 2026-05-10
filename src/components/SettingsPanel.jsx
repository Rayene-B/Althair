import { useState } from 'react';
import { LogOut, Plus, Settings, UserRound, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import TextInput from './TextInput';
import { login, signup } from '../utils/api';

export default function SettingsPanel({
  user,
  accounts,
  onSwitchAccount,
  onAccountAuthenticated,
  onRemoveAccount,
  onLogoutCurrent,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
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
      onAccountAuthenticated(auth);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowAddAccount(false);
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <Card className="surface-card mb-3 w-[360px] max-w-[calc(100vw-2.5rem)] border-cyan-200/18">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Settings</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Accounts</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-white/10 bg-white/[0.04] text-white/58 hover:text-white"
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {accounts.map((account) => {
              const active = account.user.id === user?.id;
              return (
                <div
                  key={account.user.id}
                  className={`flex items-center gap-2 rounded-[8px] border p-2 ${
                    active ? 'border-cyan-200/28 bg-cyan-300/10' : 'border-white/8 bg-slate-950/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSwitchAccount(account)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <UserRound size={16} className={active ? 'text-cyan-100' : 'text-white/54'} />
                    <span className="truncate text-sm text-white/76">{account.user.email}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveAccount(account)}
                    className="grid h-8 w-8 place-items-center rounded-[8px] text-white/45 hover:bg-white/8 hover:text-white"
                    aria-label={`Sign out ${account.user.email}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {showAddAccount ? (
            <form onSubmit={submit} className="mt-4 space-y-3 rounded-[8px] border border-white/8 bg-slate-950/35 p-3">
              <div className="flex gap-2">
                <Button type="button" variant={mode === 'login' ? 'active' : 'ghost'} onClick={() => setMode('login')} className="flex-1">
                  Log in
                </Button>
                <Button type="button" variant={mode === 'signup' ? 'active' : 'ghost'} onClick={() => setMode('signup')} className="flex-1">
                  Sign up
                </Button>
              </div>
              <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
              <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required minLength={8} />
              {mode === 'signup' && (
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={8}
                />
              )}
              {error && <p className="text-xs text-amber-100">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddAccount(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 disabled:opacity-50">
                  {isLoading ? 'Checking...' : 'Add'}
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setShowAddAccount(true)} className="mt-4 flex w-full items-center justify-center gap-2">
              <Plus size={16} />
              Add account
            </Button>
          )}

          <Button type="button" onClick={onLogoutCurrent} className="mt-3 flex w-full items-center justify-center gap-2">
            <LogOut size={16} />
            Log out current
          </Button>
        </Card>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-12 w-12 place-items-center rounded-full border border-cyan-200/24 bg-slate-950/82 text-cyan-100 shadow-glow backdrop-blur transition hover:border-cyan-200/48 hover:bg-cyan-300/12"
        aria-label="Open settings"
      >
        <Settings size={21} />
      </button>
    </div>
  );
}
