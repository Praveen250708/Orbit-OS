import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  Wind, 
  CheckCircle2, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Smartphone
} from 'lucide-react';
import { api, Task } from '../api/client';
import confetti from 'canvas-confetti';

interface FocusPageProps {
  initialTask?: Task | null;
  onTaskCompleted?: () => void;
}

export const FocusPage: React.FC<FocusPageProps> = ({ initialTask, onTaskCompleted }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialTask || null);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [intervention, setIntervention] = useState<any>(null);
  const [subtasks, setSubtasks] = useState<any[]>([]);

  useEffect(() => {
    loadPendingTasks();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setSecondsRemaining((selectedTask.estimated_minutes || 45) * 60);
      setSubtasks(selectedTask.suggested_subtasks || []);
    }
  }, [selectedTask]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => setSecondsRemaining((p) => p - 1), 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      handleFinishTask();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const loadPendingTasks = async () => {
    try {
      const res = await api.getTasks({ status: 'pending' });
      setTasks(res);
      if (!selectedTask && res.length > 0) {
        setSelectedTask(res[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTimer = async () => {
    if (!isRunning) {
      if (!sessionId) {
        try {
          const sess = await api.startFocusSession({
            task_id: selectedTask?.id,
            planned_minutes: Math.ceil(secondsRemaining / 60)
          });
          setSessionId(sess.id);
        } catch (e) {
          console.error(e);
        }
      }
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const handleFinishTask = async () => {
    if (!selectedTask) return;
    try {
      const elapsedMins = Math.max(1, Math.round(((selectedTask.estimated_minutes || 45) * 60 - secondsRemaining) / 60));
      if (sessionId) {
        await api.updateFocusSession(sessionId, {
          actual_minutes: elapsedMins,
          completion_status: 'completed'
        });
      }
      await api.completeTask(selectedTask.id, {
        actual_minutes: elapsedMins,
        completion_status: 'completed'
      });
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      if (onTaskCompleted) onTaskCompleted();
      loadPendingTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogDistraction = async (trigger: string) => {
    try {
      const res = await api.recordDistraction({
        focus_session_id: sessionId || undefined,
        trigger_type: trigger,
        duration_minutes: 2.0
      });
      setIntervention(res.intervention);
      setShowIntervention(true);
    } catch (e) {
      console.error(e);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={`p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 ${
      isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-8 flex flex-col justify-between max-w-none' : ''
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Dedicated Focus Mode
            </h1>
            <p className="text-xs text-slate-500">
              Zero noise, minimal stimulus, and immediate urge-to-scroll intervention.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Focus'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Focus Centerpiece */}
      <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
        {selectedTask ? (
          <>
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Current Deep Work Sprint
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                {selectedTask.title}
              </h2>
              {selectedTask.description && (
                <p className="text-xs text-slate-500 max-w-md mx-auto">{selectedTask.description}</p>
              )}
            </div>

            {/* Huge Clean Timer */}
            <div className="text-7xl md:text-8xl font-mono font-bold tracking-tighter text-slate-900 dark:text-white py-4 select-none">
              {timeStr}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-md transition-all ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                {isRunning ? 'Pause Focus' : 'Start Focus Timer'}
              </button>

              <button
                onClick={() => setSecondsRemaining((selectedTask.estimated_minutes || 45) * 60)}
                className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleFinishTask}
                className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="py-8">
            <p className="text-sm text-slate-500">No pending task selected. Select a task below to start focus.</p>
          </div>
        )}

        {/* Urge to scroll quick interventions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 w-full max-w-lg">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Urge to open distracting apps? Tap to activate 90s dopamine reset:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'instagram_reels', label: 'Instagram Reels / Shorts' },
              { id: 'phone_notification', label: 'Check Phone' },
              { id: 'urge_to_browse', label: 'Boredom Browsing' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleLogDistraction(btn.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Android Companion Clarity Note */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3 text-xs text-slate-500">
        <Smartphone className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Device Distraction Architecture: </span>
          Orbit OS provides in-browser focus shields, distraction logging, and micro-interventions today. An optional companion Android application can connect for system-level App Usage APIs and lockouts.
        </div>
      </div>

      {/* Intervention Dialog */}
      {showIntervention && intervention && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-brand-500/30 p-6 shadow-2xl text-center space-y-4">
            <Wind className="w-10 h-10 text-brand-500 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{intervention.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{intervention.action}</p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 italic">
              "{intervention.mindset}"
            </div>
            <button
              onClick={() => setShowIntervention(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand-500 text-white"
            >
              Resume Focus Sprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
