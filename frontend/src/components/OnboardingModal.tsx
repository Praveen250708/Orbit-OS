import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Target, Moon, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goalTitle, setGoalTitle] = useState('Master Machine Learning');
  const [wakingTime, setWakingTime] = useState('07:30');
  const [sleepingTime, setSleepingTime] = useState('23:30');
  const [availableHours, setAvailableHours] = useState(6.5);
  const [focusDuration, setFocusDuration] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      // 1. Complete user onboarding settings
      await api.completeOnboarding({
        name: name.trim() || 'Alex Mercer',
        preferences: {
          waking_time: wakingTime,
          sleeping_time: sleepingTime,
          daily_available_hours: availableHours,
          focus_duration: focusDuration,
          break_duration: 10,
          phone_distraction_guard: true,
          distraction_apps: ['Instagram Reels', 'YouTube Shorts', 'TikTok'],
          energy_peak: 'morning'
        }
      });

      // 2. Create initial goal with automatic roadmap derivation
      if (goalTitle.trim()) {
        await api.createGoal({
          title: goalTitle.trim(),
          category: 'career',
          priority: 'must-do'
        }, true);
      }

      // 3. Generate initial schedule
      const todayStr = new Date().toISOString().split('T')[0];
      await api.generateSchedule({
        local_date: todayStr,
        available_hours: availableHours,
        readiness_energy: 'high'
      });

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      onComplete();
    } catch (e: any) {
      alert(`Onboarding error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-8 shadow-2xl space-y-6 animate-scale-up">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Welcome to Orbit OS
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Step {step} of 3</span>
        </div>

        {/* Step 1: Identity & Primary Goal */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                What should Orbit OS call you?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Let's calibrate your autonomous personal execution environment.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Your Primary Goal Right Now
              </label>
              <input
                type="text"
                placeholder="e.g. Master Machine Learning or Ship Portfolio Project"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Orbit OS will automatically derive sequential topics, practice exercises, and daily tasks.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Waking & Sleep Boundaries */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Protecting your sleep boundaries
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                We guarantee schedules never stretch into sleep and always leave room for recovery.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Typical Wake Time
                </label>
                <input
                  type="time"
                  value={wakingTime}
                  onChange={(e) => setWakingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Sleep Cutoff Time
                </label>
                <input
                  type="time"
                  value={sleepingTime}
                  onChange={(e) => setSleepingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Daily Available Study / Focus Time:</span>
                <span className="text-brand-600 dark:text-brand-400 font-bold">{availableHours} hrs</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="0.5"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Distraction Guard Confirmation */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Reducing phone &amp; Reels distractions
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Reels and Shorts fragment your dopamine circuits. Orbit OS activates mindful pauses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/40 space-y-2">
              <span className="text-xs font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-600" />
                Active Focus Protocols:
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li>Pre-session prompt to place phone face-down across the desk</li>
                <li>One-tap urge-to-scroll logging with 90-second breathing timer</li>
                <li>Micro-step decomposition whenever a task feels intimidating</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Generating Curriculum & Plan...' : 'Launch Orbit OS'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
