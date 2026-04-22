import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./auth/LoginPage";
import CampaignList from "./campaigns/CampaignList";
import CampaignCreate from "./campaigns/CampaignCreate";
import CampaignDetail from "./campaigns/CampaignDetail";
import SessionView from "./sessions/SessionView";

export default function App() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const inSession = /^\/campaigns\/[^/]+\/sessions\//.test(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="eyebrow animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (inSession) {
    return (
      <Routes>
        <Route path="/campaigns/:campaignId/sessions/:sessionId" element={<SessionView />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-ink-900/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-8 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="sigil" />
            <div className="leading-tight">
              <div className="font-serif text-[22px] text-parchment group-hover:text-gold-300 transition-colors">
                Mythor<em className="italic text-gold-400">i</em>a
              </div>
              <div className="font-mono text-[10px] tracking-eyebrow uppercase text-ink-400">Table de nuit</div>
            </div>
          </Link>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[11px] tracking-label uppercase text-ink-300">
              {user.displayName ?? user.email?.split("@")[0]}
            </span>
            <button
              onClick={logout}
              className="font-mono text-[11px] tracking-label uppercase text-ink-400 hover:text-ember transition-colors"
            >
              Sortir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-10 fade-in">
        <Routes>
          <Route path="/" element={<CampaignList />} />
          <Route path="/campaigns/new" element={<CampaignCreate />} />
          <Route path="/campaigns/:campaignId" element={<CampaignDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-rule py-6 text-center">
        <div className="font-mono text-[10px] tracking-label uppercase text-ink-400">
          Mythoria · Table de nuit éclairée par une lanterne
        </div>
      </footer>
    </div>
  );
}
