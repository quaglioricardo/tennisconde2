import React, { useCallback, useEffect, useState } from 'react';
import { Award, ClipboardCheck, PlusCircle, Shuffle, Users } from 'lucide-react';
import type { PendingAction, Ranking } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api, formatMonth } from '../lib/api';
import { navigate } from '../lib/route';
import { RankingFormModal } from './RankingFormModal';
import { primaryBtn, Spinner } from './ui';

export const RankingsListView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [rankings, setRankings] = useState<Ranking[] | null>(null);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    api.rankings().then((r) => setRankings(r.rankings));
    api.pending().then((r) => setPending(r.pending)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-court-800 p-6 rounded-3xl text-white border border-court-700">
        <div>
          <span className="bg-court-500/25 text-court-200 border border-court-400/50 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Todos contra todos</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Rankings</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">Cada jogador enfrenta todos os outros uma vez. Vitória pontua mais que derrota; derrota pontua mais que WO.</p>
        </div>
        {isAdmin && (
          <button className={primaryBtn} onClick={() => setCreateOpen(true)}><PlusCircle className="w-4 h-4" /> Novo ranking</button>
        )}
      </div>

      {pending.length > 0 && (
        <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-4">
          <h2 className="text-sm font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2"><ClipboardCheck className="w-4 h-4" /> Você tem {pending.length} {pending.length === 1 ? 'pendência' : 'pendências'}</h2>
          <ul className="space-y-1">
            {pending.map((p) => (
              <li key={p.match.id}>
                <button onClick={() => navigate({ kind: 'ranking', id: p.rankingId, matchId: p.match.id })} className="text-left text-xs text-amber-900 dark:text-amber-200 hover:underline">
                  {p.action === 'confirm' ? 'Confirmar resultado' : 'Reportar resultado'} vs <strong>{p.opponentName}</strong> — {p.rankingName} ({formatMonth(p.match.month)}){p.match.player1Id === user?.id && ' 🎾 você leva as bolas'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!rankings ? <Spinner /> : rankings.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          <Award className="w-10 h-10 mx-auto mb-2 text-slate-400" />
          Nenhum ranking ainda.{isAdmin && ' Crie o primeiro.'}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rankings.map((r) => (
            <li key={r.id}>
              <button onClick={() => navigate({ kind: 'ranking', id: r.id })} className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge status={r.status} />
                  {r.isParticipant && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">você participa</span>}
                </div>
                <h3 className="font-extrabold text-base leading-tight">{r.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Início: {formatMonth(r.startMonth)}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> {r.participantCount} participantes • {r.matchesPerMonth} jogos/mês</p>
                <p className="text-[11px] text-slate-400 mt-2">Pontos: V {r.pointsWin} • D {r.pointsLoss} • WO {r.pointsWo}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <RankingFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={(r) => navigate({ kind: 'ranking', id: r.id })} />
    </div>
  );
};

export const StatusBadge: React.FC<{ status: Ranking['status'] }> = ({ status }) =>
  status === 'draft' ? (
    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Rascunho</span>
  ) : (
    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><Shuffle className="w-3 h-3" /> Sorteado</span>
  );
