import React from 'react';
import { 
  Sun, 
  Moon, 
  Calendar, 
  Target, 
  BookOpen, 
  Clock, 
  Sparkles, 
  BarChart2, 
  Settings, 
  Flame,
  CheckCircle2,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCheckin: () => void;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
  onOpenCheckin,
  user
}) => {
  const navItems = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'goals', label: 'My Goals', icon: Target },
    { id: 'syllabus', label: 'Syllabus & Q&A', icon: GraduationCap },
    { id: 'learning', label: 'Learning Paths', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'focus', label: 'Focus Mode', icon: Clock },
    { id: 'progress', label: 'Progress & Insights', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center p-1.5 border border-brand-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <circle cx="24" cy="24" r="20" stroke="#4f46e5" strokeWidth="3" strokeDasharray="8 4" opacity="0.4"/>
                <ellipse cx="24" cy="24" rx="22" ry="9" stroke="#6366f1" strokeWidth="3" transform="rotate(-25 24 24)"/>
                <circle cx="24" cy="24" r="6" fill="#4f46e5"/>
                <circle cx="38" cy="18" r="3.5" fill="#818cf8"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Orbit OS
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  AI
                </span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Autonomous Execution</p>
            </div>
          </div>
        </div>

        {/* Quick Check-in Banner Button */}
        <div className="px-3 pt-4 pb-1">
          <button
            onClick={onOpenCheckin}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-slate-800/60 border border-brand-200/60 dark:border-brand-900/50 flex items-center justify-between text-brand-700 dark:text-brand-300 hover:shadow-sm transition-all text-xs font-medium group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 group-hover:rotate-12 transition-transform" />
              Daily Check-in
            </span>
            <span className="text-[10px] font-semibold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-2xs border border-brand-100 dark:border-brand-900">
              Flow
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Controls */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Distraction Guard Active
          </span>
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OR'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.name || 'Orbit Pioneer'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {user?.email || 'demo@orbitos.ai'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
