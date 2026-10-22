import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  ShieldAlert, 
  Wind, 
  ChevronRight,
  ListTodo,
  Clock
} from 'lucide-react';
import { Task, api } from '../api/client';
import confetti from 'canvas-confetti';

interface TaskExecutionModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const [subtasks, setSubtasks] = useState(task.suggested_subtasks || []);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState((task.estimated_minutes || 45) * 60);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionData, setInterventionData] = useState<any>(null);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [completionPrompt, setCompletionPrompt] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'partial' | 'needs_more_time'>('completed');
  const [remainingMinutes, setRemainingMinutes] = useState(15);
  const [notes, setNotes] = useState('');

  // Breathing intervention state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    setSubtasks(task.suggested_subtasks || []);
    setSecondsRemaining((task.estimated_minutes || 45) * 60);
  }, [task]);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setCompletionPrompt(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  // Breathing loop
  useEffect(() => {
    if (showIntervention) {
      const cycle = setInterval(() => {
        setBreathPhase((p) => (p === 'Inhale' ? 'Hold' : p === 'Hold' ? 'Exhale' : 'Inhale'));
      }, 3500);
      return () => clearInterval(cycle);
    }
  }, [showIntervention]);

  const toggleTimer = async () => {
    if (!isTimerRunning) {
      if (!activeSessionId) {
        try {
          const sess = await api.startFocusSession({
            task_id: task.id,
            planned_minutes: Math.ceil(secondsRemaining / 60)
          });
          setActiveSessionId(sess.id);
        } catch (e) {
          console.error('Session start error:', e);
        }
      }
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  };

  const handleToggleSubtask = async (index: number) => {
    const updated = [...subtasks];
    updated[index].done = !updated[index].done;
    setSubtasks(updated);
    try {
      await api.updateTask(task.id, {
        suggested_subtasks: updated
      });
      onTaskUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBreakdownTask = async () => {
    try {
      setIsBreakingDown(true);
      const res = await api.breakdownTask(task.id);
      if (res && res.task) {
        setSubtasks(res.task.suggested_subtasks || []);
        onTaskUpdated();
      }
    } catch (err: any) {
      alert(`Breakdown error: ${err.message}`);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleRecordDistraction = async (triggerType: string) => {
    try {
      const res = await api.recordDistraction({
        focus_session_id: activeSessionId || undefined,
        trigger_type: triggerType,
        duration_minutes: 2.0
      });
      setInterventionData(res.intervention);
      setShowIntervention(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSession = async () => {
    try {
      const elapsedMinutes = Math.max(1, Math.round(((task.estimated_minutes || 45) * 60 - secondsRemaining) / 60));
      
      if (activeSessionId) {
        await api.updateFocusSession(activeSessionId, {
          actual_minutes: elapsedMinutes,
          completion_status: completionStatus,
          notes: notes
        });
      }

      await api.completeTask(task.id, {
        actual_minutes: elapsedMinutes,
        notes: notes,
        completion_status: completionStatus,
        remaining_minutes_needed: remainingMinutes
      });

      if (completionStatus === 'completed') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      alert(`Error completing session: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formatTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800">
              Focus Mode
            </span>
            <span className="text-xs text-slate-400 capitalize">• {task.task_type.replace('_', ' ')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
              {task.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {task.description || 'Focus on one step at a time without distractions.'}
            </p>
          </div>

          {/* Minimalist Focus Timer Panel */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">
              {formatTime}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTimer}
                className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                {isTimerRunning ? 'Pause Session' : 'Start Focus'}
              </button>
              <button
                onClick={() => setSecondsRemaining((task.estimated_minutes || 45) * 60)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
              Phone in another room or face down for optimal dopamine recovery.
            </p>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-brand-500" />
                Actionable Subtasks
              </h3>
              <button
                onClick={handleBreakdownTask}
                disabled={isBreakingDown}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isBreakingDown ? 'Breaking down...' : "I'm Stuck — Break Into Micro-Steps"}
              </button>
            </div>

            <div className="space-y-2">
              {subtasks.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No subtasks generated yet. Click "Break Into Micro-Steps" above.
                </div>
              ) : (
                subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleSubtask(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      st.done
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400 line-through'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-brand-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium">{st.title}</p>
                      {st.tip && <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-0.5">{st.tip}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acceptance Criteria */}
          {task.completion_criteria && task.completion_criteria.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Definition of Done
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {task.completion_criteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Distraction Log & Interventions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Felt an urge to distract? (One-tap logging &amp; calm intervention)
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'instagram_reels', label: 'Instagram Reels / Shorts' },
                { id: 'phone_notification', label: 'Phone Notification' },
                { id: 'urge_to_browse', label: 'Urge to Browse' },
                { id: 'daydreaming', label: 'Daydreaming' }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleRecordDistraction(d.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCompletionPrompt(true)}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Wrap Up Session
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                setCompletionStatus('completed');
                handleCompleteSession();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Complete
            </button>
          </div>
        </div>
      </div>

      {/* Breathing / Urge Intervention Modal */}
      {showIntervention && interventionData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-brand-500/30 p-6 shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto border border-brand-500/30">
              <Wind className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {interventionData.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {interventionData.action}
              </p>
            </div>

            {/* Breathing Circle Animation */}
            <div className="py-4">
              <div className="w-24 h-24 rounded-full border-4 border-brand-500 flex items-center justify-center mx-auto transition-transform duration-1000 scale-105">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-300">{breathPhase}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">{interventionData.micro_technique}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic">
              "{interventionData.mindset}"
            </div>

            <button
              onClick={() => setShowIntervention(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all"
            >
              I Am Ready to Refocus
            </button>
          </div>
        </div>
      )}

      {/* End of Session Wrap-up Modal */}
      {completionPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              How did this session go?
            </h3>
            <p className="text-xs text-slate-500">
              Orbit OS will automatically adapt the rest of today's schedule based on your progress.
            </p>

            <div className="space-y-2">
              {[
                { id: 'completed', label: 'Task is 100% Complete', desc: 'Ready for next activity' },
                { id: 'partial', label: 'Partially Complete', desc: 'Made progress, needs a bit more time' },
                { id: 'needs_more_time', label: 'Needs More Time', desc: 'Still in early stages, reschedule remaining' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCompletionStatus(opt.id as any)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    completionStatus === opt.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{opt.label}</p>
                  <p className="text-[10px] text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>

            {completionStatus !== 'completed' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Estimated minutes still needed:
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={remainingMinutes}
                  onChange={(e) => setRemainingMinutes(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCompletionPrompt(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Working
              </button>
              <button
                onClick={handleCompleteSession}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all"
              >
                Save &amp; Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
