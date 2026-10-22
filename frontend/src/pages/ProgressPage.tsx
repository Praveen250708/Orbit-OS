import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Send,
  MessageSquare,
  Award
} from 'lucide-react';
import { api, WeeklyAnalytics } from '../api/client';
import confetti from 'canvas-confetti';

export const ProgressPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Daily Review Form States
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasHard, setWhatWasHard] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getWeeklyAnalytics();
      setAnalytics(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      await api.submitDailyReview({
        local_date: todayStr,
        what_went_well: whatWentWell,
        what_was_hard: whatWasHard,
        adjustments_for_tomorrow: adjustments
      });
      setReviewSubmitted(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Computing empirical weekly trends...</p>
      </div>
    );
  }

  const triggerColors = ['#6366f1', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Progress &amp; Empirical Insights
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Transparent metrics without shaming. Real data showing your focus execution and distraction mitigation.
        </p>
      </div>

      {/* 4 Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Task Completion Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.completion_rate}%</span>
              <span className="text-xs text-emerald-500 font-semibold">Weekly</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Deep Work Logged
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{analytics.total_focus_minutes}</span>
              <span className="text-xs text-slate-400">minutes</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Planned vs Actual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {(analytics.planned_vs_actual_ratio * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-400">estimation match</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Distractions Mitigated
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analytics.total_distractions}</span>
              <span className="text-xs text-slate-400">logged &amp; caught</span>
            </div>
          </div>
        </div>
      )}

      {/* 2 CHARTS */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Focus Trend Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Daily Focus Minutes (Past 7 Days)
                </h3>
                <p className="text-[11px] text-slate-400">Uninterrupted work sessions</p>
              </div>
              <Clock className="w-4 h-4 text-brand-500" />
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.daily_completion_trend}>
                  <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                  <Area type="monotone" dataKey="focus_minutes" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#focusGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distraction Distribution Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Common Distraction Triggers
                </h3>
                <p className="text-[11px] text-slate-400">Targeted by Orbit OS distraction guard</p>
              </div>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.distraction_triggers_distribution} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="trigger" type="category" stroke="#94a3b8" fontSize={10} width={90} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {analytics.distraction_triggers_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={triggerColors[index % triggerColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Practical Empirical Suggestions */}
      {analytics && analytics.personalized_suggestions && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Autonomous Adaptive Observations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {analytics.personalized_suggestions.map((s, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NIGHTLY REVIEW FORM */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Nightly Reflection</h3>
            <p className="text-[11px] text-slate-400">
              3 short prompts to update task estimates and reinforce tomorrow's autonomous planning.
            </p>
          </div>
        </div>

        {reviewSubmitted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Daily review submitted!
            </p>
            <p className="text-[11px] text-slate-500">
              Your feedback is saved to tune tomorrow's focus durations and break buffer algorithms.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1. What went well today?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Completed the PyTorch module without touching Reels"
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. What was hard or distracting?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Afternoon dip caused impulse to check phone"
                  value={whatWasHard}
                  onChange={(e) => setWhatWasHard(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  3. Adjustments for tomorrow?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Schedule a 20-min recharge walk at 3:30 PM"
                  value={adjustments}
                  onChange={(e) => setAdjustments(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingReview ? 'Submitting...' : 'Complete Nightly Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
