const API_BASE = '/api/v1';

export interface Task {
  id: number;
  user_id: number;
  goal_id?: number | null;
  learning_topic_id?: number | null;
  title: string;
  description?: string | null;
  task_type: string;
  priority: string;
  priority_score: number;
  estimated_minutes: number;
  actual_minutes: number;
  deadline?: string | null;
  scheduled_date?: string | null;
  status: string;
  source_type: string;
  source_id?: string | null;
  completion_criteria: string[];
  suggested_subtasks: { title: string; done: boolean; tip?: string }[];
  energy_level: string;
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  category: string;
  target_date?: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export interface LearningTopic {
  id: number;
  learning_path_id: number;
  title: string;
  description?: string | null;
  order_index: number;
  prerequisite_topic_ids: number[];
  mastery_status: string;
  assessment_results: Record<string, any>;
  created_at: string;
}

export interface LearningPath {
  id: number;
  user_id: number;
  goal_id?: number | null;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
  topics: LearningTopic[];
}

export interface ScheduleItem {
  id: number;
  schedule_id: number;
  task_id?: number | null;
  fixed_event_id?: number | null;
  title: string;
  start_at: string;
  end_at: string;
  item_type: 'task' | 'break' | 'buffer' | 'fixed_event';
  status: string;
  task?: Task | null;
}

export interface Schedule {
  id: number;
  user_id: number;
  local_date: string;
  version: number;
  status: string;
  conflict_summary?: string | null;
  items: ScheduleItem[];
  created_at: string;
}

export interface TodayDashboardData {
  greeting: string;
  current_date: string;
  on_track: boolean;
  status_message: string;
  completed_tasks_count: number;
  total_tasks_count: number;
  focus_minutes_today: number;
  daily_focus_target_minutes: number;
  current_task?: Task | null;
  next_task?: Task | null;
  schedule?: Schedule | null;
  upcoming_tasks: Task[];
  unfinished_tasks: Task[];
  distraction_summary: {
    count: number;
    guard_active: boolean;
    monitored_apps: string[];
  };
}

export interface DailyCheckinStatus {
  already_checked_in: boolean;
  last_checkin_date?: string | null;
  pending_yesterday_tasks: Task[];
  upcoming_fixed_events: any[];
  today_schedule?: Schedule | null;
}

export interface WeeklyAnalytics {
  completion_rate: number;
  total_focus_minutes: number;
  planned_vs_actual_ratio: number;
  total_distractions: number;
  daily_completion_trend: { date: string; day: string; completed: number; focus_minutes: number }[];
  distraction_triggers_distribution: { trigger: string; count: number }[];
  top_habit_consistency: number;
  personalized_suggestions: string[];
}

export interface SyllabusTopic {
  name: string;
  subtopics: string[];
  sample_questions: string[];
}

export interface SyllabusUnit {
  unit_number: string;
  title: string;
  periods: number;
  course_outcome: string;
  topics: SyllabusTopic[];
}

export interface CourseSyllabus {
  id: string;
  title: string;
  code: string;
  description: string;
  textbooks: string[];
  units: SyllabusUnit[];
}

export interface AnswerResponse {
  question: string;
  course: string;
  topic: string;
  source: string;
  answer: string;
}

export interface FixedEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  recurrence_rule?: string | null;
  color?: string;
}

export interface UserPreferences {
  waking_time: string;
  sleeping_time: string;
  daily_available_hours: number;
  focus_duration: number;
  break_duration: number;
  long_break_duration: number;
  phone_distraction_guard: boolean;
  distraction_apps: string[];
  energy_peak: string;
  preferred_language: string;
  reminders_enabled: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string | null;
  timezone: string;
  onboarding_completed: boolean;
  preferences: UserPreferences;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('orbit_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorBody.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth & Onboarding
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; name?: string }) =>
    request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<UserProfile>('/auth/me'),
  completeOnboarding: (data: any) =>
    request<{ status: string; user: UserProfile }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getTodayDashboard: () => request<TodayDashboardData>('/dashboard/today'),

  // Daily Check-in
  getCheckinStatus: (dateStr: string) => request<DailyCheckinStatus>(`/daily-checkin/${dateStr}`),
  submitDailyCheckin: (data: {
    local_date: string;
    energy_level: string;
    available_hours?: number;
    changes_today?: string;
    new_urgent_task_titles: string[];
    confirm_priorities: boolean;
  }) =>
    request<{ status: string; message: string; schedule_id: number; items_scheduled: number; conflicts: string[]; deferred_tasks: any[] }>(
      '/daily-checkin',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Goals
  getGoals: () => request<UserGoal[]>('/goals'),
  createGoal: (data: { title: string; description?: string; category: string; priority: string; target_date?: string }, autoGenerate = true) =>
    request<UserGoal>(`/goals?auto_generate_path=${autoGenerate}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGoal: (id: number, data: Partial<UserGoal>) =>
    request<UserGoal>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Learning Paths
  getLearningPaths: () => request<LearningPath[]>('/learning-paths'),
  getLearningPathDetail: (id: number) => request<LearningPath>(`/learning-paths/${id}`),
  generateTopics: (id: number) =>
    request<{ status: string; topics_generated: number; learning_path: LearningPath }>(`/learning-paths/${id}/generate-topics`, {
      method: 'POST',
    }),
  updateTopicMastery: (topicId: number, masteryStatus: string) =>
    request<LearningTopic>(`/learning-paths/topics/${topicId}/mastery?mastery_status=${masteryStatus}`, {
      method: 'PATCH',
    }),

  // Tasks
  getTasks: (params?: { status?: string; goal_id?: number; scheduled_date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.goal_id) qs.append('goal_id', params.goal_id.toString());
    if (params?.scheduled_date) qs.append('scheduled_date', params.scheduled_date);
    return request<Task[]>(`/tasks?${qs.toString()}`);
  },
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  completeTask: (id: number, data: { actual_minutes?: number; notes?: string; completion_status: string; remaining_minutes_needed?: number }) =>
    request<Task>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  rescheduleTask: (id: number, data: { new_date?: string; reason?: string }) =>
    request<Task>(`/tasks/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  breakdownTask: (id: number) =>
    request<{ status: string; task: Task; micro_steps: any[] }>(`/tasks/${id}/breakdown`, {
      method: 'POST',
    }),

  // Schedule
  getSchedule: (dateStr: string) => request<Schedule | null>(`/schedule/${dateStr}`),
  generateSchedule: (data: { local_date: string; available_hours?: number; readiness_energy?: string }) =>
    request<Schedule>('/schedule/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  replanDay: (data: { local_date: string; reason?: string }) =>
    request<{ schedule_id: number; version: number; explanation: string; conflicts: string[]; deferred_count: number }>('/schedule/replan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Focus Sessions
  startFocusSession: (data: { task_id?: number; planned_minutes: number }) =>
    request<any>('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFocusSession: (id: number, data: any) =>
    request<any>(`/focus-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Distraction Guard
  getDistractions: () => request<any[]>('/distractions'),
  recordDistraction: (data: {
    focus_session_id?: number;
    trigger_type: string;
    duration_minutes?: number;
    notes?: string;
  }) =>
    request<{ status: string; event_id: number; intervention: any }>('/distractions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Daily Review & Reflection
  getDailyReview: (dateStr: string) => request<any>(`/daily-review/${dateStr}`),
  submitDailyReview: (data: {
    local_date: string;
    what_went_well?: string;
    what_was_hard?: string;
    adjustments_for_tomorrow?: string;
  }) =>
    request<any>('/daily-review', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Analytics
  getWeeklyAnalytics: () => request<WeeklyAnalytics>('/analytics/weekly'),

  // Settings & Fixed Events
  getSettings: () => request<UserProfile>('/settings'),
  updateSettings: (data: any) =>
    request<UserProfile>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getFixedEvents: () => request<FixedEvent[]>('/settings/fixed-events'),
  createFixedEvent: (data: Partial<FixedEvent>) =>
    request<FixedEvent>('/settings/fixed-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteFixedEvent: (id: number) =>
    request<any>(`/settings/fixed-events/${id}`, {
      method: 'DELETE',
    }),

  // Course Syllabus & AI Exam Assistant
  getCourses: () => request<any[]>('/syllabus/courses'),
  getCourseSyllabus: (courseId: string) => request<CourseSyllabus>(`/syllabus/courses/${courseId}`),
  askSyllabusQuestion: (data: { course_title: string; unit_title: string; topic_name: string; question: string }) =>
    request<AnswerResponse>('/syllabus/answer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  enrollCourseAsGoal: (courseId: string) =>
    request<{ status: string; message: string; goal_id: number; learning_path_id: number }>(`/syllabus/courses/${courseId}/enroll`, {
      method: 'POST',
    }),
};
