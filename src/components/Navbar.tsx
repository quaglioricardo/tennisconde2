import React, { useState } from 'react';
import { Award, KeyRound, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { navigate, type Route } from '../lib/route';
import { NotificationBell } from './NotificationBell';
import { Avatar, ErrorBanner, inputCls, labelCls, Modal, primaryBtn } from './ui';

const tabs: { key: Route['kind']; label: string; icon: React.ReactNode; route: Route }[] = [
  { key: 'rankings', label: 'Rankings', icon: <Award className="w-3.5 h-3.5" />, route: { kind: 'rankings' } },
  { key: 'players', label: 'Jogadores', icon: <Users className="w-3.5 h-3.5" />, route: { kind: 'players' } },
];

export const Navbar: React.FC<{ route: Route }> = ({ route }) => {
  const { user, isAdmin, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const active = route.kind === 'ranking' ? 'rankings' : route.kind;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <a href="#/rankings" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-court-500 to-court-300 flex items-center justify-center  text-xl">🎾</div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-court-100 to-court-400 bg-clip-text text-transparent">Tennis Conde 2</span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Ranking • Todos contra todos</p>
            </div>
          </a>

          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {tabs.map((t) => (
              <button
                key={t.key} onClick={() => navigate(t.route)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active === t.key ? 'bg-court-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}
              >
                {t.icon}<span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 bg-slate-800/90 py-1 px-2 rounded-xl border border-slate-700 hover:border-emerald-500/50">
                <Avatar name={user!.name} size="sm" />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold leading-tight max-w-[140px] truncate">{user!.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    {isAdmin ? <><ShieldCheck className="w-3 h-3 text-amber-400" /> <span className="text-amber-400 font-bold">Admin</span></> : 'Jogador'}
                  </p>
                </div>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden z-50" onMouseLeave={() => setMenu(false)}>
                  <div className="px-4 py-3 border-b border-slate-800 md:hidden">
                    <p className="text-xs font-bold">{user!.name}</p>
                    <p className="text-[10px] text-slate-400">{isAdmin ? 'Admin' : 'Jogador'}</p>
                  </div>
                  <button onClick={() => { setMenu(false); setPwOpen(true); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Alterar senha
                  </button>
                  <button onClick={() => logout()} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 flex items-center gap-2 text-red-300">
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
};

const ChangePasswordModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.changePassword(current, next);
      setDone(true);
      setCurrent(''); setNext('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao alterar senha');
    }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setDone(false); }} title="Alterar senha" icon={<KeyRound className="w-5 h-5 text-emerald-400" />}>
      {done ? (
        <p className="text-sm text-emerald-300">Senha alterada com sucesso.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div><label className={labelCls}>Senha atual</label><input className={inputCls} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" /></div>
          <div><label className={labelCls}>Nova senha</label><input className={inputCls} type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} autoComplete="new-password" /></div>
          <ErrorBanner message={error} />
          <button className={`${primaryBtn} w-full`} type="submit">Salvar</button>
        </form>
      )}
    </Modal>
  );
};
