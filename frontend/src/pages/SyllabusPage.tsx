import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  HelpCircle, 
  Send, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { api, CourseSyllabus, SyllabusUnit, SyllabusTopic, AnswerResponse } from '../api/client';
import confetti from 'canvas-confetti';

interface SyllabusPageProps {
  onStartFocusOnTopic?: (topicName: string, desc: string) => void;
  onRefreshDashboard?: () => void;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ 
  onStartFocusOnTopic,
  onRefreshDashboard 
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('artificial-intelligence');
  const [syllabus, setSyllabus] = useState<CourseSyllabus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Expanded Units & Topics state
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'UNIT-I': true,
    'UNIT-II': true
  });

  // Active Q&A Modal / Drawer state
  const [activeQuestion, setActiveQuestion] = useState<{
    courseTitle: string;
    unitTitle: string;
    topicName: string;
    questionText: string;
  } | null>(null);

  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [loadingAnswer, setLoadingAnswer] = useState<boolean>(false);
  const [customQuestionInput, setCustomQuestionInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [enrolledMsg, setEnrolledMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCoursesList();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseSyllabus(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCoursesList = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res);
      if (res.length > 0 && !selectedCourseId) {
        setSelectedCourseId(res[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCourseSyllabus = async (courseId: string) => {
    try {
      setLoading(true);
      const res = await api.getCourseSyllabus(courseId);
      setSyllabus(res);
      // Expand all units initially
      const initExp: Record<string, boolean> = {};
      res.units.forEach((u) => {
        initExp[u.unit_number] = true;
      });
      setExpandedUnits(initExp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (unitNumber: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitNumber]: !prev[unitNumber]
    }));
  };

  const handleAskQuestion = async (
    courseTitle: string,
    unitTitle: string,
    topicName: string,
    questionText: string
  ) => {
    setActiveQuestion({
      courseTitle,
      unitTitle,
      topicName,
      questionText
    });
    setAnswerData(null);
    setLoadingAnswer(true);

    try {
      const res = await api.askSyllabusQuestion({
        course_title: courseTitle,
        unit_title: unitTitle,
        topic_name: topicName,
        question: questionText
      });
      setAnswerData(res);
    } catch (err: any) {
      alert(`Error fetching answer: ${err.message}`);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleCustomQuestionSubmit = (e: React.FormEvent, unitTitle: string, topicName: string) => {
    e.preventDefault();
    if (!customQuestionInput.trim() || !syllabus) return;
    handleAskQuestion(syllabus.title, unitTitle, topicName, customQuestionInput.trim());
    setCustomQuestionInput('');
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await api.enrollCourseAsGoal(selectedCourseId);
      setEnrolledMsg(res.message);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      if (onRefreshDashboard) onRefreshDashboard();
      setTimeout(() => setEnrolledMsg(null), 5000);
    } catch (err: any) {
      alert(`Enrollment error: ${err.message}`);
    }
  };

  const handleCopyAnswer = () => {
    if (answerData?.answer) {
      navigator.clipboard.writeText(answerData.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter topics based on search term
  const filterUnits = (units: SyllabusUnit[]) => {
    if (!searchTerm.trim()) return units;
    const term = searchTerm.toLowerCase();

    return units.map((u) => {
      const filteredTopics = u.topics.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.subtopics.some((s) => s.toLowerCase().includes(term)) ||
          t.sample_questions.some((q) => q.toLowerCase().includes(term))
      );
      return {
        ...u,
        topics: filteredTopics
      };
    }).filter((u) => u.topics.length > 0 || u.title.toLowerCase().includes(term));
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-brand-500" />
            University Syllabus &amp; Course Exam Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pick your course to view granular topic breakdowns, and generate complete high-scoring answers for any exam question.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {enrolledMsg && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
              {enrolledMsg}
            </span>
          )}
          <button
            onClick={handleEnrollCourse}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Enroll As Orbit OS Goal
          </button>
        </div>
      </div>

      {/* Course Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {courses.map((c) => {
          const isSelected = selectedCourseId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {c.code}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-2">
                  {c.title}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                5 Units • {c.textbooks_count} Textbooks
              </p>
            </button>
          );
        })}
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search any concept across all units (e.g. A* Algorithm, Bayes Theorem, Poisson Distribution, Scrum, Resolution)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Main Syllabus Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading course syllabus and topics...</p>
        </div>
      ) : !syllabus ? (
        <div className="p-12 text-center text-xs text-slate-500">Course syllabus not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Course Metadata Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Course Code: {syllabus.code}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{syllabus.title}</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Total: 45 Periods / 5 Units</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{syllabus.description}</p>
            
            {/* Textbooks list */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Prescribed University Textbooks:
              </span>
              <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
                {syllabus.textbooks.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Units Accordion */}
          <div className="space-y-4">
            {filterUnits(syllabus.units).map((unit) => {
              const isExpanded = expandedUnits[unit.unit_number] ?? true;
              return (
                <div
                  key={unit.unit_number}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Unit Title Bar */}
                  <div
                    onClick={() => toggleUnit(unit.unit_number)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border-b border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 text-xs font-bold shrink-0">
                        {unit.unit_number}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{unit.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{unit.course_outcome}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400">{unit.periods} Periods</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Unit Topics Breakdown */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 animate-fade-in bg-slate-50/30 dark:bg-slate-950/20">
                      {unit.topics.map((topic, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-4"
                        >
                          {/* Topic Name */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {topic.name}
                              </h4>
                            </div>

                            {onStartFocusOnTopic && (
                              <button
                                onClick={() => onStartFocusOnTopic(topic.name, topic.subtopics.join(', '))}
                                className="px-3 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors self-start md:self-auto"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Start Focus Sprint
                              </button>
                            )}
                          </div>

                          {/* Sub-topics list */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Topics &amp; Concepts to Cover:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {topic.subtopics.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                                >
                                  <span className="text-brand-500 font-bold shrink-0">•</span>
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* University Exam Questions with AI Answer Generation */}
                          {topic.sample_questions && topic.sample_questions.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-2">
                                University Exam Questions (Click to Generate Full Answer):
                              </span>
                              <div className="space-y-2">
                                {topic.sample_questions.map((q, qIdx) => (
                                  <div
                                    key={qIdx}
                                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors bg-white dark:bg-slate-900 group"
                                  >
                                    <div className="flex items-start gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                                      <HelpCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                                      <span>{q}</span>
                                    </div>
                                    <button
                                      onClick={() => handleAskQuestion(syllabus.title, unit.title, topic.name, q)}
                                      className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[11px] flex items-center gap-1.5 shrink-0 shadow-2xs transition-all"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Generate Answer
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Custom Question for this topic */}
                          <div className="pt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder={`Ask any specific question about ${topic.name}...`}
                              value={customQuestionInput}
                              onChange={(e) => setCustomQuestionInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomQuestionSubmit(e, unit.title, topic.name);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button
                              onClick={(e) => handleCustomQuestionSubmit(e, unit.title, topic.name)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3" /> Ask
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ANSWER MODAL / DIALOG */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Orbit OS AI Examination Engine
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {activeQuestion.questionText}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {answerData && (
                  <button
                    onClick={handleCopyAnswer}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Copy Answer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveQuestion(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Course &amp; Unit: </span>
                <span className="text-slate-500 dark:text-slate-400">{activeQuestion.courseTitle} • {activeQuestion.unitTitle}</span>
              </div>

              {loadingAnswer ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs">Formulating comprehensive academic exam answer with diagrams &amp; derivations...</p>
                </div>
              ) : answerData ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                  {answerData.answer}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Ready for university 13-mark &amp; 2-mark assessments.</span>
              <button
                onClick={() => setActiveQuestion(null)}
                className="px-5 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-sm hover:bg-brand-600 transition-colors"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
