import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Pencil, Shuffle, Trash2, Trophy, Undo2, X } from 'lucide-react';
import type { Match, RankingDetail, User } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, formatMonth, formatSets } from '../lib/api';
import { navigate } from '../lib/route';
import { RankingFormModal } from './RankingFormModal';
import { StatusBadge } from './RankingsListView';
import { ResultModal } from './ResultModal';
import { Avatar, dangerBtn, ErrorBanner, primaryBtn, secondaryBtn, Spinner } from './ui';

export const RankingDetailView: React.FC<{ id: string; highlightMatchId?: string }> = ({ id, highlightMatchId }) => {
  const { user, isAdmin } = useAuth();
  const [detail, setDetail] = useState<RankingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resultModal, setResultModal] = useState<{ match: Match; mode: 'report' | 'admin' } | null>(null);
  const [rejecting, setRejecting] = useState<Match | null>(null);
  const [month, setMonth] = useState<string | 'all'>('all');
  const [onlyMine, setOnlyMine] = useState(false);

  const load = useCallback(() => {
    api.ranking(id).then(setDetail).catch((e) => setError(e instanceof ApiError ? e.message : 'Falha ao carregar'));
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!highlightMatchId || !detail) return;
    const el = document.getElementById(`match-${highlightMatchId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightMatchId, detail]);

  const byId = useMemo(() => new Map((detail?.participants ?? []).map((p) => [p.id, p])), [detail]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); load(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Falha na operação'); }
  };

  if (error && !detail) return <ErrorBanner message={error} />;
  if (!detail) return <Spinner />;

  const { ranking, matches, standings, months, currentMonth } = detail;
  const visible = matches
    .filter((m) => month === 'all' || m.month === month)
    .filter((m) => !onlyMine || m.player1Id === user!.id || m.player2Id === user!.id);
  const grouped = months.filter((mo) => visible.some((m) => m.month === mo)).map((mo) => ({ month: mo, matches: visible.filter((m) => m.month === mo) }));

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ kind: 'rankings' })} className="text-xs font-semibold text-slate-500 hover:text-emerald-500 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Rankings</button>

      <div className="bg-court-800 p-6 rounded-3xl text-white border border-court-700">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <StatusBadge status={ranking.status} />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{ranking.name}</h1>
            <p className="text-sm text-slate-300 mt-1">
              {ranking.participantCount} participantes • início {formatMonth(ranking.startMonth)} • {ranking.matchesPerMonth} jogos/mês
            </p>
            <p className="text-xs text-slate-400 mt-1">Pontos: vitória {ranking.pointsWin} • derrota {ranking.pointsLoss} • WO {ranking.pointsWo}</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {ranking.status === 'draft' && (
                <>
                  <button className={secondaryBtn} onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4" /> Editar</button>
                  <button className={primaryBtn} onClick={() => setConfirmDraw(true)} disabled={ranking.participantCount < 2}><Shuffle className="w-4 h-4" /> Sortear</button>
                </>
              )}
              <button className={dangerBtn} onClick={() => setConfirmDelete(true)}><Trash2 className="w-4 h-4" /> Apagar</button>
            </div>
          )}
        </div>

        {confirmDraw && (
          <ConfirmBox
            text="Sortear gera todos os jogos e congela participantes e pontuação. Não dá para desfazer (só apagar o ranking). Continuar?"
            onYes={() => { setConfirmDraw(false); act(() => api.drawRanking(id)); }} onNo={() => setConfirmDraw(false)}
          />
        )}
        {confirmDelete && (
          <ConfirmBox
            text="Apagar este ranking remove todos os jogos, resultados e notificações relacionadas. Continuar?"
            danger onYes={() => { setConfirmDelete(false); api.deleteRanking(id).then(() => navigate({ kind: 'rankings' })).catch((e) => setError(e.message)); }} onNo={() => setConfirmDelete(false)}
          />
        )}
      </div>

      <ErrorBanner message={error} />

      {ranking.status === 'draft' ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="font-extrabold text-sm mb-3">Participantes ({detail.participants.length})</h2>
          {detail.participants.length === 0 ? <p className="text-xs text-slate-500">Nenhum participante ainda.</p> : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {detail.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm"><Avatar name={p.name} size="sm" /> {p.name}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500 mt-4">Rascunho: o sorteio ainda não aconteceu. {isAdmin ? 'Edite os participantes e clique em Sortear quando estiver pronto.' : 'Aguarde o sorteio pela administração.'}</p>
        </section>
      ) : (
        <>
          <Standings standings={standings} meId={user!.id} />

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-sm mr-2">Jogos</h2>
              <Chip active={month === 'all'} onClick={() => setMonth('all')}>Todos</Chip>
              {months.map((mo) => (
                <Chip key={mo} active={month === mo} onClick={() => setMonth(mo)} current={mo === currentMonth}>{formatMonth(mo)}</Chip>
              ))}
              <span className="text-[11px] text-slate-500 ml-auto" title="O jogador da esquerda leva as bolas">🎾 = leva as bolas</span>
              {ranking.isParticipant && (
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer">
                  <input type="checkbox" className="accent-emerald-500" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Só meus jogos
                </label>
              )}
            </div>

            {grouped.length === 0 && <p className="text-xs text-slate-500 py-6 text-center">Nenhum jogo neste filtro.</p>}
            {grouped.map((g) => (
              <div key={g.month}>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
                  {formatMonth(g.month)}
                  {g.month < currentMonth && <span className="text-[10px] normal-case text-slate-500">(encerrado)</span>}
                  {g.month === currentMonth && <span className="text-[10px] normal-case text-emerald-500">(mês atual)</span>}
                </h3>
                <ul className="grid gap-3 md:grid-cols-2">
                  {g.matches.map((m) => (
                    <MatchCard
                      key={m.id} match={m} p1={byId.get(m.player1Id)} p2={byId.get(m.player2Id)} me={user!} isAdmin={isAdmin}
                      currentMonth={currentMonth} highlighted={m.id === highlightMatchId}
                      onReport={() => setResultModal({ match: m, mode: 'report' })}
                      onAdmin={() => setResultModal({ match: m, mode: 'admin' })}
                      onConfirm={() => act(() => api.confirm(m.id))}
                      onReject={() => setRejecting(m)}
                      onWithdraw={() => act(() => api.withdraw(m.id))}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}

      <RankingFormModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} existing={{ ranking, participants: detail.participants }} />
      <ResultModal
        open={!!resultModal} onClose={() => setResultModal(null)} onDone={load}
        match={resultModal?.match ?? null} mode={resultModal?.mode ?? 'report'}
        p1={resultModal ? byId.get(resultModal.match.player1Id) : undefined} p2={resultModal ? byId.get(resultModal.match.player2Id) : undefined}
      />
      {rejecting && (
        <RejectPrompt onCancel={() => setRejecting(null)} onSubmit={(reason) => { const m = rejecting; setRejecting(null); act(() => api.reject(m.id, reason)); }} />
      )}
    </div>
  );
};

const Chip: React.FC<{ active: boolean; current?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, current, onClick, children }) => (
  <button onClick={onClick} className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${active ? 'bg-court-600 border-court-600 text-white' : current ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-emerald-500'}`}>
    {children}
  </button>
);

const ConfirmBox: React.FC<{ text: string; danger?: boolean; onYes: () => void; onNo: () => void }> = ({ text, danger, onYes, onNo }) => (
  <div className="mt-4 bg-slate-950/60 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <AlertTriangle className={`w-5 h-5 shrink-0 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
    <p className="text-sm text-slate-200 flex-1">{text}</p>
    <div className="flex gap-2">
      <button className={secondaryBtn} onClick={onNo}>Cancelar</button>
      <button className={danger ? dangerBtn : primaryBtn} onClick={onYes}>Confirmar</button>
    </div>
  </div>
);

const Standings: React.FC<{ standings: RankingDetail['standings']; meId: string }> = ({ standings, meId }) => (
  <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
      <Trophy className="w-4 h-4 text-amber-500" /><h2 className="font-extrabold text-sm">Classificação</h2>
      <span className="text-[10px] text-slate-500 ml-auto">V vitórias • D derrotas • WO • SS saldo de sets • SG saldo de games</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-slate-500">
          <tr className="text-left">
            <th className="px-4 py-2 w-10">#</th><th className="px-2 py-2">Jogador</th>
            <th className="px-2 py-2 text-right">Pts</th><th className="px-2 py-2 text-right">J</th><th className="px-2 py-2 text-right">V</th>
            <th className="px-2 py-2 text-right">D</th><th className="px-2 py-2 text-right">WO</th>
            <th className="px-2 py-2 text-right hidden sm:table-cell">SS</th><th className="px-4 py-2 text-right hidden sm:table-cell">SG</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((r) => (
            <tr key={r.userId} className={`border-t border-slate-100 dark:border-slate-800 ${r.userId === meId ? 'bg-emerald-500/10' : ''}`}>
              <td className="px-4 py-2 font-black text-slate-400">{r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : r.position}</td>
              <td className="px-2 py-2"><div className="flex items-center gap-2"><Avatar name={r.name} size="sm" /><span className="font-semibold truncate">{r.name}</span></div></td>
              <td className="px-2 py-2 text-right font-black text-emerald-600 dark:text-emerald-400">{r.points}</td>
              <td className="px-2 py-2 text-right">{r.played}</td><td className="px-2 py-2 text-right">{r.wins}</td>
              <td className="px-2 py-2 text-right">{r.losses}</td><td className="px-2 py-2 text-right text-red-500">{r.wos}</td>
              <td className="px-2 py-2 text-right hidden sm:table-cell">{signed(r.setsFor - r.setsAgainst)}</td>
              <td className="px-4 py-2 text-right hidden sm:table-cell">{signed(r.gamesFor - r.gamesAgainst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

interface MatchCardProps {
  match: Match; p1?: User; p2?: User; me: User; isAdmin: boolean; currentMonth: string; highlighted: boolean;
  onReport: () => void; onAdmin: () => void; onConfirm: () => void; onReject: () => void; onWithdraw: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match: m, p1, p2, me, isAdmin, currentMonth, highlighted, onReport, onAdmin, onConfirm, onReject, onWithdraw }) => {
  const mine = m.player1Id === me.id || m.player2Id === me.id;
  const monthOpen = m.month >= currentMonth;
  const name = (id: string | null) => (id === p1?.id ? p1?.name : id === p2?.id ? p2?.name : '?');

  const result = m.status === 'pending' ? null
    : m.resultType === 'wo'
      ? m.woPlayerIds.length === 2 ? 'WO duplo' : `WO de ${name(m.woPlayerIds[0])}`
      : `${name(m.winnerId)} venceu ${formatSets(m.sets)}`;

  const status = m.status === 'confirmed'
    ? { label: m.resolvedBy === 'system' ? 'WO automático' : m.resolvedBy === 'admin' ? 'Definido pela admin' : 'Confirmado', cls: m.resultType === 'wo' ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
    : m.status === 'reported'
      ? { label: `Aguardando ${name(m.reportedBy === m.player1Id ? m.player2Id : m.player1Id)}`, cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
      : { label: monthOpen ? 'Pendente' : 'Mês encerrado', cls: 'bg-slate-500/15 text-slate-500' };

  const Side: React.FC<{ u?: User; won: boolean; wo: boolean; balls?: boolean }> = ({ u, won, wo, balls }) => (
    <div className={`flex items-center gap-2 min-w-0 ${won ? 'font-black' : 'font-semibold'} ${wo ? 'text-red-500 line-through' : ''}`}>
      <span className="relative shrink-0">
        <Avatar name={u?.name ?? '?'} size="sm" />
        {balls && <span className="absolute -bottom-1 -right-1 text-[11px] leading-none" title="Leva as bolas" aria-label="Leva as bolas">🎾</span>}
      </span>
      <span className="truncate text-sm">{u?.name ?? '?'}{u?.id === me.id && <span className="text-[10px] text-emerald-500 ml-1">(você)</span>}</span>
      {won && <Check className="w-3.5 h-3.5 text-emerald-500" />}
    </div>
  );

  return (
    <li id={`match-${m.id}`} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition- ${highlighted ? 'border-emerald-500 ring-2 ring-emerald-500/40' : mine ? 'border-emerald-500/30' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Rodada {m.roundNumber}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Side u={p1} balls won={m.status !== 'pending' && m.winnerId === m.player1Id} wo={m.woPlayerIds.includes(m.player1Id)} />
        <span className="text-[10px] font-black text-slate-400">VS</span>
        <Side u={p2} won={m.status !== 'pending' && m.winnerId === m.player2Id} wo={m.woPlayerIds.includes(m.player2Id)} />
      </div>
      {result && <p className="text-xs text-slate-500 mt-2">{result}{m.status === 'reported' && ` — reportado por ${name(m.reportedBy)}`}</p>}
      {m.status === 'pending' && m.rejectionReason && <p className="text-xs text-red-400 mt-2">Último reporte rejeitado: {m.rejectionReason}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        {mine && m.status === 'pending' && monthOpen && (
          <button className={`${primaryBtn} !py-1.5 !text-xs`} onClick={onReport}><Trophy className="w-3.5 h-3.5" /> Reportar resultado</button>
        )}
        {mine && m.status === 'reported' && m.reportedBy !== me.id && (
          <>
            <button className={`${primaryBtn} !py-1.5 !text-xs`} onClick={onConfirm}><Check className="w-3.5 h-3.5" /> Confirmar</button>
            <button className={`${secondaryBtn} !py-1.5 !text-xs`} onClick={onReject}><X className="w-3.5 h-3.5" /> Rejeitar</button>
          </>
        )}
        {mine && m.status === 'reported' && m.reportedBy === me.id && (
          <button className={`${secondaryBtn} !py-1.5 !text-xs`} onClick={onWithdraw}><Undo2 className="w-3.5 h-3.5" /> Desfazer reporte</button>
        )}
        {isAdmin && (
          <button className={`${secondaryBtn} !py-1.5 !text-xs ml-auto`} onClick={onAdmin}><Pencil className="w-3.5 h-3.5" /> {m.status === 'confirmed' ? 'Alterar (admin)' : 'Definir (admin)'}</button>
        )}
      </div>
    </li>
  );
};

const RejectPrompt: React.FC<{ onCancel: () => void; onSubmit: (reason: string) => void }> = ({ onCancel, onSubmit }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 text-white space-y-3">
        <h3 className="font-extrabold">Rejeitar resultado</h3>
        <p className="text-xs text-slate-400">O jogo volta a ficar pendente e quem reportou é avisado.</p>
        <textarea className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm" rows={3} maxLength={300} placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className={secondaryBtn} onClick={onCancel}>Cancelar</button>
          <button className={dangerBtn} onClick={() => onSubmit(reason)}>Rejeitar</button>
        </div>
      </div>
    </div>
  );
};
