import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Coffee, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { api, Schedule, ScheduleItem } from '../api/client';

export const SchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [replanExplanation, setReplanExplanation] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedule(todayStr);
      setSchedule(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSchedule = async () => {
    try {
      setIsReplanning(true);
      setReplanExplanation(null);
      const res = await api.generateSchedule({
        local_date: todayStr
      });
      setSchedule(res);
    } catch (err: any) {
      alert(`Schedule generation error: ${err.message}`);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleReplanDay = async () => {
    try {
      setIsReplanning(true);
      const res = await api.replanDay({
        local_date: todayStr,
        reason: 'schedule_drift'
      });
      setReplanExplanation(res.explanation);
      loadSchedule();
    } catch (err: any) {
      alert(`Replan error: ${err.message}`);
    } finally {
      setIsReplanning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Autonomous Daily Timetable
            {schedule && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                v{schedule.version}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Guarantees fixed commitment protection, sleep boundaries, and mindful break buffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Week View Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={handleReplanDay}
            disabled={isReplanning}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-500" />
            Replan My Day
          </button>

          <button
            onClick={handleRegenerateSchedule}
            disabled={isReplanning}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin' : ''}`} />
            Regenerate Schedule
          </button>
        </div>
      </div>

      {/* Conflict / Replan Alert Notice */}
      {replanExplanation && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 animate-fade-in">
          <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Schedule Replanned: </span>
            {replanExplanation}
          </div>
        </div>
      )}

      {schedule && schedule.conflict_summary && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Constraint Adjustments Made: </span>
            {schedule.conflict_summary}
          </div>
        </div>
      )}

      {/* TIMELINE LIST */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Computing optimal constraints timetable...</p>
        </div>
      ) : !schedule || !schedule.items || schedule.items.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-brand-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No schedule generated for today</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Regenerate Schedule" to automatically construct your schedule from your goals and fixed commitments.
          </p>
          <button
            onClick={handleRegenerateSchedule}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold"
          >
            Generate Today's Schedule
          </button>
        </div>
      ) : viewMode === 'day' ? (
        <div className="space-y-3">
          {schedule.items.map((item, idx) => {
            const sDate = new Date(item.start_at);
            const eDate = new Date(item.end_at);
            const sTime = sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const eTime = eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationMins = Math.round((eDate.getTime() - sDate.getTime()) / 60000);

            const isBreak = item.item_type === 'break';
            const isFixed = item.item_type === 'fixed_event';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isBreak
                    ? 'bg-slate-50/70 dark:bg-slate-850 border-dashed border-slate-200 dark:border-slate-800 text-slate-500'
                    : isFixed
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-900/40 text-slate-800 dark:text-slate-100'
                    : isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono font-medium text-slate-400 w-28 shrink-0">
                    {sTime} – {eTime}
                  </div>

                  <div className="flex items-center gap-3">
                    {isBreak ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                    ) : isFixed ? (
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {durationMins} minutes • <span className="capitalize">{item.item_type.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isBreak
                      ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  }`}>
                    {item.status}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View Grid */
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
            <div key={dIdx} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 min-h-[300px]">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{day}</span>
              <div className="space-y-1.5 pt-2">
                {dIdx === 3 ? (
                  schedule.items.slice(0, 4).map((it, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-[10px] font-medium text-brand-800 dark:text-brand-300 truncate">
                      {it.title}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Planned flow</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
