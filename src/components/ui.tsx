import React from 'react';
import { X } from 'lucide-react';

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ name, size = 'md', className = '' }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-extrabold text-white shrink-0 ${className}`}
      style={{ background: `hsl(${hue} 55% 40%)` }}
      title={name}
    >
      {initials}
    </div>
  );
};

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; wide?: boolean }> = ({
  open, onClose, title, subtitle, icon, children, wide,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-slate-900 border border-slate-700 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-3xl p-6 text-white max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="font-extrabold text-base">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ErrorBanner: React.FC<{ message: string | null }> = ({ message }) =>
  message ? <div className="text-xs font-semibold text-red-300 bg-red-950/50 border border-red-800 rounded-xl px-3 py-2">{message}</div> : null;

export const inputCls =
  'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-court-400';
export const labelCls = 'block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1';
export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors';
export const secondaryBtn =
  'inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors';
export const dangerBtn =
  'inline-flex items-center justify-center gap-1.5 bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors';

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Carregando…' }) => (
  <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center">
    <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /> {label}
  </div>
);
