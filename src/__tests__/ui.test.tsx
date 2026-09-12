import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RankingDetail, User } from '../../shared/types';

const admin: User = { id: 'u-admin', name: 'Thales Minussi', username: 'thales', role: 'admin', createdAt: '' };
const ana: User = { id: 'u-ana', name: 'Ana Souza', username: 'ana', role: 'player', createdAt: '' };
const bia: User = { id: 'u-bia', name: 'Bia Lima', username: 'bia', role: 'player', createdAt: '' };

const detail: RankingDetail = {
  ranking: {
    id: 'r1', name: 'Ranking Teste', status: 'drawn', startMonth: '2026-09', matchesPerMonth: 3, pointsWin: 300, pointsLoss: 100,
    pointsWo: -100, createdBy: admin.id, createdAt: '', drawnAt: '', participantCount: 3, isParticipant: true,
  },
  participants: [admin, ana, bia],
  matches: [
    {
      id: 'm1', rankingId: 'r1', roundNumber: 1, month: '2026-09', player1Id: admin.id, player2Id: ana.id, status: 'pending',
      resultType: null, winnerId: null, woPlayerIds: [], sets: null, reportedBy: null, reportedAt: null, confirmedBy: null,
      confirmedAt: null, resolvedBy: null, rejectionReason: null, updatedAt: '',
    },
    {
      id: 'm2', rankingId: 'r1', roundNumber: 2, month: '2026-09', player1Id: ana.id, player2Id: bia.id, status: 'confirmed',
      resultType: 'played', winnerId: bia.id, woPlayerIds: [], sets: [{ p1: 4, p2: 6 }, { p1: 3, p2: 6 }], reportedBy: ana.id,
      reportedAt: '', confirmedBy: bia.id, confirmedAt: '', resolvedBy: 'players', rejectionReason: null, updatedAt: '',
    },
    {
      id: 'm3', rankingId: 'r1', roundNumber: 3, month: '2026-10', player1Id: bia.id, player2Id: admin.id, status: 'reported',
      resultType: 'wo', winnerId: admin.id, woPlayerIds: [bia.id], sets: null, reportedBy: bia.id, reportedAt: '', confirmedBy: null,
      confirmedAt: null, resolvedBy: null, rejectionReason: null, updatedAt: '',
    },
  ],
  standings: [
    { userId: bia.id, name: bia.name, position: 1, points: 3, played: 1, wins: 1, losses: 0, wos: 0, setsFor: 2, setsAgainst: 0, gamesFor: 12, gamesAgainst: 7 },
    { userId: ana.id, name: ana.name, position: 2, points: 1, played: 1, wins: 0, losses: 1, wos: 0, setsFor: 0, setsAgainst: 2, gamesFor: 7, gamesAgainst: 12 },
    { userId: admin.id, name: admin.name, position: 3, points: 0, played: 0, wins: 0, losses: 0, wos: 0, setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0 },
  ],
  months: ['2026-09', '2026-10'],
  currentMonth: '2026-09',
};

vi.mock('../lib/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../lib/api')>();
  return {
    ...mod,
    api: {
      ...mod.api,
      me: vi.fn(async () => ({ user: admin })),
      ranking: vi.fn(async () => detail),
      rankings: vi.fn(async () => ({ rankings: [detail.ranking] })),
      pending: vi.fn(async () => ({ pending: [] })),
      notifications: vi.fn(async () => ({ items: [{ id: 'n1', type: 'score_reported', title: 'Bia reportou', body: 'x', rankingId: 'r1', matchId: 'm3', readAt: null, createdAt: new Date().toISOString() }], unread: 1 })),
      markRead: vi.fn(async () => undefined),
      users: vi.fn(async () => ({ users: [admin, ana, bia] })),
      confirm: vi.fn(async () => ({ match: detail.matches[2] })),
      report: vi.fn(async () => ({ match: detail.matches[0] })),
    },
  };
});

import App from '../App';
import { api } from '../lib/api';

beforeEach(() => {
  window.location.hash = '#/rankings/r1';
});

describe('App (admin who is also a participant)', () => {
  it('renders standings, matches, bell badge and opens the report modal', async () => {
    render(<App />);
    await screen.findByText('Ranking Teste');

    // standings table
    expect(screen.getAllByText('Bia Lima').length).toBeGreaterThan(0);
    expect(screen.getByText('Classificação')).toBeTruthy();

    // matches: pending -> report button; confirmed -> result line; reported by other -> confirm
    expect(screen.getByText('Reportar resultado')).toBeTruthy();
    expect(screen.getByText(/Bia Lima venceu 4\/6\s+3\/6/)).toBeTruthy();
    expect(screen.getByText('Confirmar')).toBeTruthy();
    expect(screen.getByText('WO de Bia Lima — reportado por Bia Lima')).toBeTruthy();
    // admin override buttons on every card
    expect(screen.getAllByText(/\(admin\)/).length).toBe(3);

    // bell shows unread count; opening marks read
    const bell = screen.getByLabelText('Notificações');
    await waitFor(() => expect(bell.textContent).toBe('1'));
    fireEvent.click(bell);
    await waitFor(() => expect(api.markRead).toHaveBeenCalled());
    expect(screen.getByText('Bia reportou')).toBeTruthy();

    // open report modal and submit
    fireEvent.click(screen.getByText('Reportar resultado'));
    expect(await screen.findByText('O oponente precisará confirmar')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('Reportar')); });
    await waitFor(() => expect(api.report).toHaveBeenCalledWith('m1', { type: 'played', sets: [{ p1: 6, p2: 4 }, { p1: 6, p2: 4 }] }));

    // confirm the WO reported by Bia
    await act(async () => { fireEvent.click(screen.getByText('Confirmar')); });
    await waitFor(() => expect(api.confirm).toHaveBeenCalledWith('m3'));
  });

  it('shows the super tie-break row only when sets are split, and submits 3 sets', async () => {
    render(<App />);
    await screen.findByText('Ranking Teste');
    fireEvent.click(screen.getByText('Reportar resultado'));
    await screen.findByText('O oponente precisará confirmar');
    expect(screen.queryByText('Super tie-break')).toBeNull();
    const inputs = screen.getAllByRole('spinbutton');
    // 2nd set: 4/6 -> split -> super tie-break appears with 10/8 default
    fireEvent.change(inputs[2], { target: { value: '4' } });
    fireEvent.change(inputs[3], { target: { value: '6' } });
    expect(screen.getByText('Super tie-break')).toBeTruthy();
    expect(screen.getByText('Vencedor: Thales Minussi')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('Reportar')); });
    await waitFor(() => expect(api.report).toHaveBeenCalledWith('m1', { type: 'played', sets: [{ p1: 6, p2: 4 }, { p1: 4, p2: 6 }, { p1: 10, p2: 8 }] }));
    // back to 2-0 -> row disappears
  });

  it('rankings list shows the card and the admin create button', async () => {
    window.location.hash = '#/rankings';
    render(<App />);
    await screen.findByText('Novo ranking');
    expect(await screen.findByText('Ranking Teste')).toBeTruthy();
  });
});
