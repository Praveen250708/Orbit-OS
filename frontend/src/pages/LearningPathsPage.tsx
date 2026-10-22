import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Sparkles, ChevronRight, CheckCircle2, RotateCw } from 'lucide-react';
import { api, LearningPath, LearningTopic } from '../api/client';

export const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const res = await api.getLearningPaths();
      setPaths(res);
      if (res.length > 0 && !selectedPath) {
        setSelectedPath(res[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMastery = async (topicId: number, status: string) => {
    try {
      await api.updateTopicMastery(topicId, status);
      loadPaths();
      if (selectedPath) {
        const updated = await api.getLearningPathDetail(selectedPath.id);
        setSelectedPath(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Learning Roadmaps &amp; Curricula
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sequential knowledge trees with prerequisite tracking, coding practice, and mastery verification.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading structured learning paths...</p>
        </div>
      ) : paths.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-brand-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No learning paths found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a Goal under "My Goals" and Orbit OS will automatically generate a tailored curriculum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path Selector Tabs */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Active Roadmaps
            </h3>
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPath(p)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedPath?.id === p.id
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-2xs'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                  <span>{p.topics?.length || 0} topics</span>
                  <span className="capitalize">{p.status}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Topics Sequence & Mastery Details */}
          <div className="md:col-span-2 space-y-4">
            {selectedPath && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedPath.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedPath.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sequential Curriculum &amp; Prerequisites
                  </h4>

                  {selectedPath.topics && selectedPath.topics.length > 0 ? (
                    selectedPath.topics.map((topic, idx) => {
                      const isMastered = topic.mastery_status === 'mastered';
                      const isInProgress = topic.mastery_status === 'in_progress';
                      const isNeedsRev = topic.mastery_status === 'needs_revision';

                      return (
                        <div
                          key={topic.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isMastered
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : isInProgress
                              ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500/30'
                              : 'bg-slate-50/50 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">{topic.title}</h5>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{topic.description}</p>

                                {topic.assessment_results && topic.assessment_results.criteria && (
                                  <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-brand-600 dark:text-brand-400">Criteria: </span>
                                    {topic.assessment_results.criteria.join(' • ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Mastery status badge / controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <select
                                value={topic.mastery_status}
                                onChange={(e) => handleUpdateMastery(topic.id, e.target.value)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border cursor-pointer ${
                                  isMastered
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                    : isInProgress
                                    ? 'bg-brand-100 text-brand-800 border-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800'
                                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="practiced">Practiced</option>
                                <option value="mastered">Mastered</option>
                                <option value="needs_revision">Needs Revision</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400">No topics registered yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
