import React, { useEffect, useMemo, useState } from 'react';
import { Award, Search } from 'lucide-react';
import type { Ranking, User } from '../../shared/types';
import { api, ApiError, type RankingInput } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, ErrorBanner, inputCls, labelCls, Modal, primaryBtn, secondaryBtn } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (ranking: Ranking) => void;
  existing?: { ranking: Ranking; participants: User[] };
}

/** Default start: next month. Players may play (and report) ahead of schedule, so the current month becomes warm-up time. */
function nextMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const DEFAULTS = { matchesPerMonth: 3, pointsWin: 300, pointsLoss: 100, pointsWo: -100 };

export const RankingFormModal: React.FC<Props> = ({ open, onClose, onSaved, existing }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<RankingInput>({
    name: '', startMonth: nextMonth(), ...DEFAULTS, participantIds: [],
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.users().then((r) => setUsers(r.users));
    if (existing) {
      const r = existing.ranking;
      setForm({
        name: r.name, startMonth: r.startMonth, matchesPerMonth: r.matchesPerMonth, pointsWin: r.pointsWin,
        pointsLoss: r.pointsLoss, pointsWo: r.pointsWo, participantIds: existing.participants.map((p) => p.id),
      });
    } else {
      setForm({ name: '', startMonth: nextMonth(), ...DEFAULTS, participantIds: user ? [user.id] : [] });
    }
    setError(null);
  }, [open, existing, user]);

  const filtered = useMemo(
    () => users.filter((u) => `${u.name} ${u.username}`.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );
  const toggle = (id: string) =>
    setForm((f) => ({ ...f, participantIds: f.participantIds.includes(id) ? f.participantIds.filter((x) => x !== id) : [...f.participantIds, id] }));
  // Select-all acts on the filtered list, so a search + "todos" picks just that subset.
  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => form.participantIds.includes(u.id));
  const toggleAll = () =>
    setForm((f) => {
      const ids = filtered.map((u) => u.id);
      return allFilteredSelected
        ? { ...f, participantIds: f.participantIds.filter((id) => !ids.includes(id)) }
        : { ...f, participantIds: [...new Set([...f.participantIds, ...ids])] };
    });

  const n = form.participantIds.length;
  const matchesPerPlayer = Math.max(0, n - 1);
  const months = n >= 2 ? Math.ceil(matchesPerPlayer / form.matchesPerMonth) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = existing ? await api.updateRanking(existing.ranking.id, form) : await api.createRanking(form);
      onSaved(r.ranking);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  };

  const num = (key: keyof RankingInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }));

  return (
    <Modal open={open} onClose={onClose} wide title={existing ? 'Editar rascunho' : 'Novo ranking'} subtitle="Depois do sorteio nada pode ser alterado" icon={<Award className="w-5 h-5 text-emerald-400" />}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} placeholder="Ranking Primavera 2026" />
          </div>
          <div>
            <label className={labelCls}>Mês inicial</label>
            <input className={inputCls} type="month" value={form.startMonth} onChange={(e) => setForm((f) => ({ ...f, startMonth: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>Jogos por mês (por jogador)</label>
            <input className={inputCls} type="number" min={1} max={10} value={form.matchesPerMonth} onChange={num('matchesPerMonth')} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Pontuação</label>
          <div className="grid grid-cols-3 gap-3">
            {([['pointsWin', 'Vitória'], ['pointsLoss', 'Derrota'], ['pointsWo', 'WO']] as const).map(([key, label]) => (
              <div key={key} className="bg-slate-800/60 border border-slate-700 rounded-xl p-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
                <input className={`${inputCls} mt-1`} type="number" min={-10000} max={10000} step={10} value={form[key]} onChange={num(key)} required />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Escala ATP: derrota pontua; WO pontua menos que derrota. WO duplo é aplicado automaticamente no fim do mês. Jogos podem ser disputados antes do mês previsto.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Participantes ({n})</label>
            <span className="text-[11px] text-slate-400">
              {n >= 2 ? `${matchesPerPlayer} jogos por jogador • ${(n * (n - 1)) / 2} jogos • ${months} ${months === 1 ? 'mês' : 'meses'}` : 'mínimo 2'}
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input className={`${inputCls} pl-9`} placeholder="Buscar jogador" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button type="button" className={`${secondaryBtn} !py-1.5 !text-xs whitespace-nowrap`} onClick={toggleAll} disabled={filtered.length === 0}>
              {allFilteredSelected ? 'Limpar' : search ? `Marcar ${filtered.length}` : 'Marcar todos'}
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800">
            {filtered.map((u) => {
              const on = form.participantIds.includes(u.id);
              return (
                <li key={u.id}>
                  <label className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${on ? 'bg-emerald-500/10' : 'hover:bg-slate-800/60'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(u.id)} className="accent-emerald-500" />
                    <Avatar name={u.name} size="sm" />
                    <span className="text-sm font-semibold">{u.name}</span>
                    <span className="text-xs text-slate-500 truncate">@{u.username}</span>
                  </label>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="px-3 py-4 text-xs text-slate-500 text-center">Ninguém encontrado</li>}
          </ul>
        </div>

        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={primaryBtn} disabled={busy}>{existing ? 'Salvar rascunho' : 'Criar rascunho'}</button>
        </div>
      </form>
    </Modal>
  );
};
