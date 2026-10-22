import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  RotateCcw, 
  ListTodo, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Coffee,
  Flame,
  CheckCircle
} from 'lucide-react';
import { TodayDashboardData, Task, api } from '../api/client';
import confetti from 'canvas-confetti';

interface TodayDashboardProps {
  data: TodayDashboardData | null;
  loading: boolean;
  onRefresh: () => void;
  onStartTask: (task: Task) => void;
  onOpenCheckin: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  data,
  loading,
  onRefresh,
  onStartTask,
  onOpenCheckin
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Synchronizing today's autonomous flow...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-20">
        <h2 className="text-lg font-bold mb-2">Welcome to Orbit OS</h2>
        <p className="text-xs text-slate-500 mb-4">Start your day with the daily check-in to generate your schedule.</p>
        <button
          onClick={onOpenCheckin}
          className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold"
        >
          Begin Daily Check-in
        </button>
      </div>
    );
  }

  const currentTask = data.current_task;
  const nextTask = data.next_task;
  const focusPercent = Math.min(100, Math.round((data.focus_minutes_today / Math.max(1, data.daily_focus_target_minutes)) * 100));

  const handleMarkCurrentComplete = async () => {
    if (!currentTask) return;
    try {
      await api.completeTask(currentTask.id, {
        completion_status: 'completed',
        actual_minutes: currentTask.estimated_minutes
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      onRefresh();
    } catch (err: any) {
      alert(`Error completing task: ${err.message}`);
    }
  };

  const handleSkipCurrent = async () => {
    if (!currentTask) return;
    try {
      await api.rescheduleTask(currentTask.id, {
        reason: 'user_skipped'
      });
      onRefresh();
    } catch (err: any) {
      alert(`Error skipping task: ${err.message}`);
    }
  };

  const handleAskOrbitOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    setIsAsking(true);
    setAskAnswer(null);

    setTimeout(() => {
      setIsAsking(false);
      const q = askQuery.toLowerCase();
      if (q.includes('reschedule') || q.includes('time') || q.includes('behind')) {
        setAskAnswer("Orbit OS recommends clicking 'Replan My Day' in the Schedule view. It will protect your 23:30 sleep boundary and shift optional revision tasks.");
      } else if (q.includes('tired') || q.includes('burnout')) {
        setAskAnswer("Take a 15-minute screen-free walk. We can adjust the next focus block to 25 minutes instead of 45.");
      } else {
        setAskAnswer(`Based on your priorities, tackle '${currentTask?.title || "your primary goal"}' first. Dedicating 45 uninterrupted minutes will keep you 100% on track today.`);
      }
    }, 600);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {data.greeting}
            </h1>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              data.on_track 
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${data.on_track ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {data.on_track ? 'On Track Today' : 'Attention Needed'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{data.status_message}</span>
          </div>
        </div>

        {/* Daily Focus Metric Capsule */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Deep Focus Goal</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {data.focus_minutes_today} <span className="text-xs font-normal text-slate-400">/ {data.daily_focus_target_minutes}m</span>
            </span>
          </div>
          <div className="w-14 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${focusPercent}%` }}
            ></div>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800 pl-3 flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Completed</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {data.completed_tasks_count} <span className="text-xs font-normal text-slate-400">/ {data.total_tasks_count}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. THREE QUESTIONS CLARITY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            1. What should I do now?
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {currentTask ? currentTask.title : 'All pending tasks completed!'}
          </p>
          <span className="text-[11px] text-slate-400 mt-2">
            {currentTask ? `${currentTask.estimated_minutes} min • ${currentTask.priority}` : 'Great focus execution.'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            2. What comes next?
          </span>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
            {nextTask ? nextTask.title : 'Scheduled break or personal recharge'}
          </p>
          <span className="text-[11px] text-slate-400 mt-2">
            {nextTask ? `Estimated ~${nextTask.estimated_minutes} min` : 'No conflict ahead'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            3. Am I on track today?
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {data.on_track ? 'Yes, schedule is optimal' : 'Adjusted to fit sleep boundary'}
          </p>
          <span className="text-[11px] text-slate-400 mt-2">
            {data.distraction_summary.count} distraction(s) recorded today
          </span>
        </div>
      </div>

      {/* 3. HERO "CURRENT TASK" PANEL */}
      {currentTask ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Priority: {currentTask.priority}
                </span>
                <span className="text-xs text-slate-400 capitalize">• {currentTask.task_type.replace('_', ' ')}</span>
                <span className="text-xs text-slate-400">• ~{currentTask.estimated_minutes} mins</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentTask.title}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {currentTask.description || 'Focus on one step at a time without phone distractions.'}
              </p>

              {/* Subtasks summary */}
              {currentTask.suggested_subtasks && currentTask.suggested_subtasks.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    {showSubtasks ? 'Hide Subtasks' : `Show ${currentTask.suggested_subtasks.length} Suggested Subtasks`}
                  </button>

                  {showSubtasks && (
                    <div className="mt-3 space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      {currentTask.suggested_subtasks.map((st, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            st.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                          }`}>
                            {st.done ? '✓' : ''}
                          </span>
                          <span className={st.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 shrink-0 w-full md:w-48">
              <button
                onClick={() => onStartTask(currentTask)}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.01]"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Focus Session
              </button>

              <button
                onClick={handleMarkCurrentComplete}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Mark Complete
              </button>

              <button
                onClick={handleSkipCurrent}
                className="w-full py-2 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-medium text-center transition-colors"
              >
                Skip / Defer to Later
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">All today's tasks completed!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You have executed today's primary plan with focus. Rest, recharge, or review your learning paths.
          </p>
        </div>
      )}

      {/* 4. TODAY'S TIMELINE & UPCOMING LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full timeline */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Today's Scheduled Timeline
            </h3>
            <span className="text-[11px] text-slate-400">Protected sleep &amp; breaks included</span>
          </div>

          <div className="space-y-2">
            {data.schedule && data.schedule.items && data.schedule.items.length > 0 ? (
              data.schedule.items.map((item, idx) => {
                const sTime = new Date(item.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const eTime = new Date(item.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isBreak = item.item_type === 'break';
                const isFixed = item.item_type === 'fixed_event';
                const isDone = item.status === 'completed';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isBreak
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/40 text-slate-500 text-xs'
                        : isFixed
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-900/40 text-xs'
                        : isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[11px] font-mono text-slate-400 w-24 shrink-0">
                        {sTime} – {eTime}
                      </div>
                      <div className="flex items-center gap-2">
                        {isBreak && <Coffee className="w-3.5 h-3.5 text-amber-500" />}
                        {isFixed && <Calendar className="w-3.5 h-3.5 text-indigo-500" />}
                        {!isBreak && !isFixed && (
                          <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-brand-500'}`} />
                        )}
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.item_type.replace('_', ' ')}
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No schedule generated yet. Complete check-in to build today's flow.
              </div>
            )}
          </div>
        </div>

        {/* Right side: Distraction Guard & Ask Orbit OS */}
        <div className="space-y-6">
          {/* Distraction summary */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-500" />
                Distraction Guard
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Targeting unnecessary scrolling habits, especially:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(data.distraction_summary.monitored_apps || ['Instagram Reels']).map((app, i) => (
                <span key={i} className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {app}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Logged today:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{data.distraction_summary.count} session(s)</span>
            </div>
          </div>

          {/* Ask Orbit OS Widget */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-50/70 to-indigo-50/50 dark:from-slate-900 dark:to-brand-950/30 border border-brand-200/60 dark:border-brand-900/50 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Ask Orbit OS</h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Need to reschedule or adjust focus sprint? Ask anything.
            </p>

            <form onSubmit={handleAskOrbitOS} className="space-y-2">
              <input
                type="text"
                placeholder="e.g. How do I recover if I'm tired?"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-200 dark:border-brand-800/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={isAsking}
                className="w-full py-1.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
              >
                {isAsking ? 'Thinking...' : 'Get Recommendation'}
              </button>
            </form>

            {askAnswer && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-brand-200/50 dark:border-brand-900/50 text-xs text-slate-700 dark:text-slate-200 animate-fade-in leading-relaxed">
                {askAnswer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
