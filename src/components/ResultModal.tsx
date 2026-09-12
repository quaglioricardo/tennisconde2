import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { Match, SetScore, User } from '../../shared/types';
import { api, ApiError } from '../lib/api';
import { ErrorBanner, inputCls, labelCls, Modal, primaryBtn, secondaryBtn } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  match: Match | null;
  p1: User | undefined;
  p2: User | undefined;
  mode: 'report' | 'admin';
}

export const ResultModal: React.FC<Props> = ({ open, onClose, onDone, match, p1, p2, mode }) => {
  const [type, setType] = useState<'played' | 'wo'>('played');
  const [sets, setSets] = useState<SetScore[]>([{ p1: 6, p2: 4 }, { p1: 6, p2: 4 }]);
  const [wo, setWo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !match) return;
    setError(null);
    if (match.resultType === 'played' && match.sets?.length) {
      setType('played');
      setSets(match.sets);
    } else if (match.resultType === 'wo' && match.woPlayerIds.length) {
      setType('wo');
      setWo(match.woPlayerIds);
    } else {
      setType('played');
      setSets([{ p1: 6, p2: 4 }, { p1: 6, p2: 4 }]);
      setWo([]);
    }
  }, [open, match]);

  if (!match || !p1 || !p2) return null;

  // Best of 3: the super tie-break row only exists while the first two sets are split.
  const side = (s: SetScore) => (s.p1 > s.p2 ? 'p1' : s.p2 > s.p1 ? 'p2' : null);
  const split = side(sets[0]) !== null && side(sets[1]) !== null && side(sets[0]) !== side(sets[1]);
  const visibleSets = split ? sets.slice(0, 3) : sets.slice(0, 2);
  const decided = split ? side(sets[2] ?? { p1: 0, p2: 0 }) : side(sets[0]) !== null && side(sets[0]) === side(sets[1]) ? side(sets[0]) : null;
  const preview = type === 'played'
    ? decided ? `Vencedor: ${decided === 'p1' ? p1.name : p2.name}` : split ? 'Sets 1 a 1: informe o super tie-break' : 'Sem vencedor ainda'
    : wo.length === 2 ? 'WO duplo: ambos pontuam como WO' : wo.length === 1 ? `WO de ${wo[0] === p1.id ? p1.name : p2.name} — vitória de ${wo[0] === p1.id ? p2.name : p1.name}` : 'Escolha quem deu WO';

  const toggleWo = (id: string) => {
    if (mode === 'report') return setWo([id]);
    setWo((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'admin') {
        await api.adminResult(match.id, type === 'played' ? { type, sets: visibleSets } : { type, woPlayerIds: wo });
      } else {
        await api.report(match.id, type === 'played' ? { type, sets: visibleSets } : { type, woPlayerId: wo[0] });
      }
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  };

  const editSet = (i: number, who: 'p1' | 'p2', v: string) =>
    setSets((prev) => {
      const next = prev.map((s, j) => (j === i ? { ...s, [who]: Math.max(0, Math.min(i === 2 ? 30 : 7, Number(v) || 0)) } : s));
      if (next.length < 3) next.push({ p1: 10, p2: 8 });
      return next;
    });

  return (
    <Modal
      open={open} onClose={onClose}
      title={mode === 'admin' ? 'Definir resultado (admin)' : 'Reportar resultado'}
      subtitle={mode === 'admin' ? 'Confirmado na hora, sem aprovação dos jogadores' : 'O oponente precisará confirmar'}
      icon={<Trophy className="w-5 h-5 text-amber-400" />}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          {(['played', 'wo'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${type === t ? 'bg-court-600 text-white' : 'text-slate-300'}`}>
              {t === 'played' ? 'Jogo disputado' : 'WO'}
            </button>
          ))}
        </div>

        {type === 'played' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-xs font-bold text-slate-400 px-1">
              <span>Set</span><span className="w-16 text-center truncate">{p1.name.split(' ')[0]}</span><span className="w-16 text-center truncate">{p2.name.split(' ')[0]}</span>
            </div>
            {visibleSets.map((s, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center ${i === 2 ? 'pt-2 mt-1 border-t border-slate-800' : ''}`}>
                <span className="text-sm font-semibold text-slate-300 px-1">{i === 2 ? 'Super tie-break' : `${i + 1}º set`}</span>
                <input className={`${inputCls} w-16 text-center`} type="number" min={0} max={i === 2 ? 30 : 7} value={s.p1} onChange={(e) => editSet(i, 'p1', e.target.value)} />
                <input className={`${inputCls} w-16 text-center`} type="number" min={0} max={i === 2 ? 30 : 7} value={s.p2} onChange={(e) => editSet(i, 'p2', e.target.value)} />
              </div>
            ))}
            <p className="text-[11px] text-slate-500 pt-1">Melhor de 3 sets. Em 1 a 1, o super tie-break (10 pontos) decide.</p>
          </div>
        ) : (
          <div>
            <label className={labelCls}>{mode === 'admin' ? 'Quem deu WO (um ou ambos)' : 'Quem deu WO'}</label>
            <div className="grid grid-cols-2 gap-2">
              {[p1, p2].map((p) => (
                <button key={p.id} type="button" onClick={() => toggleWo(p.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${wo.includes(p.id) ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-emerald-300 font-semibold">{preview}</p>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={primaryBtn} disabled={busy || (type === 'wo' && wo.length === 0)}>{mode === 'admin' ? 'Definir' : 'Reportar'}</button>
        </div>
      </form>
    </Modal>
  );
};
