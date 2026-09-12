import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { ErrorBanner, inputCls, labelCls, primaryBtn } from './ui';

export const AuthView: React.FC = () => {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = mode === 'login' ? await api.login(username, password) : await api.register(name, username, password);
      setUser(r.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao entrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-court-500 to-court-300 flex items-center justify-center text-2xl ">🎾</div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-court-100 to-court-400 bg-clip-text text-transparent">Tennis Conde 2</h1>
            <p className="text-xs text-slate-400 font-medium">Ranking de todos contra todos</p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m} type="button" onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m ? 'bg-court-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div>
              <label className={labelCls}>Nome</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
            </div>
          )}
          <div>
            <label className={labelCls}>Usuário</label>
            <input className={inputCls} type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" placeholder="ex.: taka" />
          </div>
          <div>
            <label className={labelCls}>Senha</label>
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          <ErrorBanner message={error} />

          <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
