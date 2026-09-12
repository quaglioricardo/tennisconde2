import type {
  AdminResultInput, Match, Notification, PendingAction, Ranking, RankingDetail, ReportInput, User,
} from '../../shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Erro ${res.status}`);
  return data as T;
}

export interface RankingInput {
  name: string;
  startMonth: string;
  matchesPerMonth: number;
  pointsWin: number;
  pointsLoss: number;
  pointsWo: number;
  participantIds: string[];
}

export const api = {
  me: () => request<{ user: User | null }>('GET', '/auth/me'),
  login: (username: string, password: string) => request<{ user: User }>('POST', '/auth/login', { username, password }),
  register: (name: string, username: string, password: string) => request<{ user: User }>('POST', '/auth/register', { name, username, password }),
  logout: () => request<void>('POST', '/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) => request<void>('POST', '/auth/password', { currentPassword, newPassword }),

  users: () => request<{ users: User[] }>('GET', '/users'),

  rankings: () => request<{ rankings: Ranking[] }>('GET', '/rankings'),
  ranking: (id: string) => request<RankingDetail>('GET', `/rankings/${id}`),
  createRanking: (input: RankingInput) => request<{ ranking: Ranking }>('POST', '/rankings', input),
  updateRanking: (id: string, input: RankingInput) => request<{ ranking: Ranking }>('PUT', `/rankings/${id}`, input),
  drawRanking: (id: string) => request<{ ranking: Ranking }>('POST', `/rankings/${id}/draw`),
  deleteRanking: (id: string) => request<void>('DELETE', `/rankings/${id}`),

  pending: () => request<{ pending: PendingAction[] }>('GET', '/me/pending'),
  report: (matchId: string, input: ReportInput) => request<{ match: Match }>('POST', `/matches/${matchId}/report`, input),
  confirm: (matchId: string) => request<{ match: Match }>('POST', `/matches/${matchId}/confirm`),
  reject: (matchId: string, reason?: string) => request<{ match: Match }>('POST', `/matches/${matchId}/reject`, { reason }),
  withdraw: (matchId: string) => request<{ match: Match }>('DELETE', `/matches/${matchId}/report`),
  adminResult: (matchId: string, input: AdminResultInput) => request<{ match: Match }>('PUT', `/matches/${matchId}/result`, input),

  notifications: () => request<{ items: Notification[]; unread: number }>('GET', '/notifications'),
  markRead: (ids?: string[]) => request<void>('POST', '/notifications/read', { ids }),
};

export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatSets(sets: { p1: number; p2: number }[] | null | undefined): string {
  return (sets ?? []).map((s, i) => (i === 2 ? `[${s.p1}/${s.p2}]` : `${s.p1}/${s.p2}`)).join('  ');
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}
