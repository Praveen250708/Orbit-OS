import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BatteryCharging, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Calendar,
  Zap
} from 'lucide-react';
import { api, DailyCheckinStatus } from '../api/client';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinComplete: () => void;
  todayDateStr: string;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  onCheckinComplete,
  todayDateStr
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusData, setStatusData] = useState<DailyCheckinStatus | null>(null);

  // Form states
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [availableHours, setAvailableHours] = useState<number>(6.5);
  const [changesToday, setChangesToday] = useState('');
  const [newUrgentTasks, setNewUrgentTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      loadCheckinStatus();
    }
  }, [isOpen, todayDateStr]);

  const loadCheckinStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getCheckinStatus(todayDateStr);
      setStatusData(res);
    } catch (err) {
      console.error('Error fetching checkin status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrgentTask = () => {
    if (newTaskInput.trim()) {
      setNewUrgentTasks([...newUrgentTasks, newTaskInput.trim()]);
      setNewTaskInput('');
    }
  };

  const handleRemoveUrgentTask = (index: number) => {
    setNewUrgentTasks(newUrgentTasks.filter((_, i) => i !== index));
  };

  const handleConfirmCheckin = async () => {
    try {
      setSubmitting(true);
      await api.submitDailyCheckin({
        local_date: todayDateStr,
        energy_level: energyLevel,
        available_hours: availableHours,
        changes_today: changesToday,
        new_urgent_task_titles: newUrgentTasks,
        confirm_priorities: true
      });
      onCheckinComplete();
      onClose();
    } catch (err: any) {
      alert(`Check-in error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily Check-in</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Align your readiness and let Orbit OS plan today's realistic schedule</p>
            </div>
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
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Analyzing commitments and carried-over tasks...</p>
            </div>
          ) : (
            <>
              {/* Carried over tasks & fixed events overview */}
              {statusData && (
                <div className="space-y-3">
                  {statusData.pending_yesterday_tasks.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {statusData.pending_yesterday_tasks.length} task(s) carried forward:
                      </span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5">
                        {statusData.pending_yesterday_tasks.slice(0, 3).map((t) => (
                          <li key={t.id} className="truncate">{t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {statusData.upcoming_fixed_events.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        Protected Fixed Commitments Today:
                      </span>
                      <p className="text-slate-500 dark:text-slate-400">
                        {statusData.upcoming_fixed_events.map((e) => e.title).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Energy Readiness */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  1. Current Energy &amp; Focus Readiness
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'high', label: 'High Focus', desc: 'Ready for deep math/coding', icon: Zap, color: 'text-amber-500' },
                    { id: 'medium', label: 'Steady Pace', desc: 'Balanced problem solving', icon: BatteryCharging, color: 'text-brand-500' },
                    { id: 'low', label: 'Low / Tired', desc: 'Light revision & short steps', icon: Clock, color: 'text-slate-400' }
                  ].map((option) => {
                    const isSelected = energyLevel === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setEnergyLevel(option.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{option.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{option.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Time Today */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Available Working Hours Today
                  </label>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{availableHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2 hrs (Light day)</span>
                  <span>6.5 hrs (Standard)</span>
                  <span>12 hrs (Intense sprint)</span>
                </div>
              </div>

              {/* New Urgent Tasks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  3. Any Urgent Deliverable or Surprise Task Today?
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Submit CS assignment before 5 PM"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrgentTask())}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrgentTask}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {newUrgentTasks.length > 0 && (
                  <div className="space-y-1.5">
                    {newUrgentTasks.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-xs text-brand-900 dark:text-brand-200">
                        <span className="font-medium truncate">{t}</span>
                        <button onClick={() => handleRemoveUrgentTask(idx)} className="text-slate-400 hover:text-rose-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Orbit OS protects sleep time &amp; inserts optimal rest intervals.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckin}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Generating Schedule...' : 'Generate Today\'s Plan'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
