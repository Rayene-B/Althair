import { BarChart3, BookOpenCheck, CalendarDays, Clock3, Home, Target } from 'lucide-react';
import backgroundMain from '../../BackgroundMain.png';
import bgBlackhole from '../../BGBlackhole.png';
import bgMilkyway from '../../BGMilkyway.png';
import bgSun from '../../BGSun.png';
import bgExotic from '../../BGExotic.png';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'calendar', label: 'Calendar & Dates', icon: CalendarDays },
  { id: 'schedule', label: 'Schedule', icon: Clock3 },
  { id: 'study', label: 'Study Deck', icon: BookOpenCheck },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const pageBackgrounds = {
  dashboard: backgroundMain,
  calendar: bgBlackhole,
  dates: bgBlackhole,
  schedule: bgMilkyway,
  study: bgMilkyway,
  goals: bgExotic,
  analytics: bgSun,
};

export default function Layout({ page, onNavigate, children, user }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <div
        className="page-background"
        style={{ backgroundImage: `url(${pageBackgrounds[page] || backgroundMain})` }}
      />
      <div className="page-background-overlay" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] gap-5 px-5 py-6">
        <aside className="hidden w-60 shrink-0 rounded-[8px] border border-white/8 bg-orbit/88 p-4 shadow-card backdrop-blur lg:block">
          <div className="mb-8 px-2">
            <p className="text-xs uppercase tracking-[0.22em] text-ion/75">Althair</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Command Deck</h1>
            {user && <p className="mt-2 truncate text-xs text-white/42">{user.email}</p>}
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id || (page === 'dates' && item.id === 'calendar');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left text-sm transition ${
                    active ? 'bg-ion/14 text-ion ring-1 ring-ion/25' : 'text-white/70 hover:bg-white/7 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex gap-2 overflow-x-auto rounded-[8px] border border-white/8 bg-orbit/80 p-2 shadow-card lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id || (page === 'dates' && item.id === 'calendar');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm ${
                    active ? 'bg-ion/14 text-ion' : 'text-white/70'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
