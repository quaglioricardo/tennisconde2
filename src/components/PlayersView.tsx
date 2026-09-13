import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import type { User } from '../../shared/types';
import { api } from '../lib/api';
import { Avatar, Spinner } from './ui';

export const PlayersView: React.FC = () => {
  const [users, setUsers] = useState<User[] | null>(null);
  useEffect(() => { api.users().then((r) => setUsers(r.users)); }, []);

  return (
    <div className="space-y-6">
      <div className="bg-court-800 p-6 rounded-3xl text-white border border-court-700">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-emerald-400" /> Jogadores</h1>
        <p className="text-sm text-slate-300 mt-1">Todos os usuários cadastrados. Admins montam rankings a partir desta lista.</p>
      </div>
      {!users ? <Spinner /> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <Avatar name={u.name} />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">@{u.username}</p>
              </div>
              {u.role === 'admin' && <span className="ml-auto text-[10px] font-bold text-amber-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
