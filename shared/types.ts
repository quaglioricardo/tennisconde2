// Types shared between the API (server/) and the SPA (src/).
// Vocabulary follows CONTEXT.md.

export type Role = 'admin' | 'player';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  createdAt: string;
}

export type RankingStatus = 'draft' | 'drawn';

export interface Ranking {
  id: string;
  name: string;
  status: RankingStatus;
  startMonth: string; // YYYY-MM
  matchesPerMonth: number;
  pointsWin: number;
  pointsLoss: number;
  pointsWo: number;
  createdBy: string;
  createdAt: string;
  drawnAt: string | null;
  participantCount: number;
  isParticipant: boolean;
}

export type MatchStatus = 'pending' | 'reported' | 'confirmed';
export type ResultType = 'played' | 'wo';
export type ResolvedBy = 'players' | 'admin' | 'system';

export interface SetScore {
  p1: number;
  p2: number;
}

export interface Match {
  id: string;
  rankingId: string;
  roundNumber: number;
  month: string; // YYYY-MM
  player1Id: string;
  player2Id: string;
  status: MatchStatus;
  resultType: ResultType | null;
  winnerId: string | null;
  woPlayerIds: string[];
  sets: SetScore[] | null;
  reportedBy: string | null;
  reportedAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  resolvedBy: ResolvedBy | null;
  rejectionReason: string | null;
  updatedAt: string;
}

export interface StandingRow {
  userId: string;
  name: string;
  position: number;
  points: number;
  played: number;
  wins: number;
  losses: number;
  wos: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
}

export interface RankingDetail {
  ranking: Ranking;
  participants: User[];
  matches: Match[];
  standings: StandingRow[];
  months: string[];
  currentMonth: string;
}

export type NotificationType =
  | 'ranking_drawn'
  | 'score_reported'
  | 'score_confirmed'
  | 'score_rejected'
  | 'result_set_by_admin'
  | 'double_wo';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  rankingId: string | null;
  matchId: string | null;
  readAt: string | null;
  createdAt: string;
}

export type ReportInput =
  | { type: 'played'; sets: SetScore[] }
  | { type: 'wo'; woPlayerId: string };

export type AdminResultInput =
  | { type: 'played'; sets: SetScore[] }
  | { type: 'wo'; woPlayerIds: string[] };

export interface PendingAction {
  match: Match;
  rankingId: string;
  rankingName: string;
  opponentName: string;
  action: 'report' | 'confirm';
}
