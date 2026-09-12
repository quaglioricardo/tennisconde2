import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRoute } from './lib/route';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { PlayersView } from './components/PlayersView';
import { RankingDetailView } from './components/RankingDetailView';
import { RankingsListView } from './components/RankingsListView';
import { Spinner } from './components/ui';

const Shell: React.FC = () => {
  const { user, loading } = useAuth();
  const route = useRoute();

  if (loading) return <div className="min-h-screen bg-slate-950"><Spinner label="Entrando…" /></div>;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar route={route} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {route.kind === 'rankings' && <RankingsListView />}
        {route.kind === 'ranking' && <RankingDetailView key={route.id} id={route.id} highlightMatchId={route.matchId} />}
        {route.kind === 'players' && <PlayersView />}
      </main>
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-5 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <span className="font-extrabold text-slate-900 dark:text-white">Tennis Conde 2</span><span>• Ranking todos contra todos</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
