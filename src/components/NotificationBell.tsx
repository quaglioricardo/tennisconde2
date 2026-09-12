import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '../../shared/types';
import { api, timeAgo } from '../lib/api';
import { navigate } from '../lib/route';

const POLL_MS = 30_000;

export const NotificationBell: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    api.notifications().then((r) => { setItems(r.items); setUnread(r.unread); }).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Opening the bell marks everything as read.
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api.markRead().catch(() => {});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    }
  };

  const go = (n: Notification) => {
    setOpen(false);
    if (n.rankingId) navigate({ kind: 'ranking', id: n.rankingId, matchId: n.matchId ?? undefined });
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200" title="Notificações" aria-label="Notificações">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl z-50">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-extrabold text-white">Notificações</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><CheckCheck className="w-3 h-3" /> lidas ao abrir</span>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-500 px-4 py-8 text-center">Nenhuma notificação ainda.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => go(n)} className="w-full text-left px-4 py-3 border-b border-slate-800/70 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? 'bg-slate-700' : 'bg-emerald-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <p className="text-xs text-slate-400 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
