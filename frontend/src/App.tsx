import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TodayDashboard } from './pages/TodayDashboard';
import { GoalsPage } from './pages/GoalsPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { LearningPathsPage } from './pages/LearningPathsPage';
import { SchedulePage } from './pages/SchedulePage';
import { FocusPage } from './pages/FocusPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { TaskExecutionModal } from './components/TaskExecutionModal';
import { OnboardingModal } from './components/OnboardingModal';
import { api, TodayDashboardData, UserProfile, Task } from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState('today');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('orbit_theme') === 'dark';
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<TodayDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Modals
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [executingTask, setExecutingTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Theme sync
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('orbit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('orbit_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. Fetch user profile
      const userData = await api.getMe();
      setUser(userData);

      // Check onboarding
      if (!userData.onboarding_completed) {
        setIsOnboardingOpen(true);
      } else {
        // Check if daily checkin needed today
        const checkinStatus = await api.getCheckinStatus(todayStr);
        if (!checkinStatus.already_checked_in) {
          setIsCheckinOpen(true);
        }
      }

      // 2. Fetch dashboard data
      loadDashboard();
    } catch (e) {
      console.error('App init error:', e);
      loadDashboard();
    }
  };

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const data = await api.getTodayDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleStartTask = (task: Task) => {
    setExecutingTask(task);
  };

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenCheckin={() => setIsCheckinOpen(true)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen">
        {currentTab === 'today' && (
          <TodayDashboard
            data={dashboardData}
            loading={loadingDashboard}
            onRefresh={loadDashboard}
            onStartTask={handleStartTask}
            onOpenCheckin={() => setIsCheckinOpen(true)}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsPage
            onNavigateToRoadmap={() => setCurrentTab('learning')}
          />
        )}

        {currentTab === 'syllabus' && (
          <SyllabusPage
            onStartFocusOnTopic={(topicName, desc) => {
              setCurrentTab('focus');
            }}
            onRefreshDashboard={loadDashboard}
          />
        )}

        {currentTab === 'learning' && (
          <LearningPathsPage />
        )}

        {currentTab === 'schedule' && (
          <SchedulePage />
        )}

        {currentTab === 'focus' && (
          <FocusPage
            initialTask={dashboardData?.current_task}
            onTaskCompleted={loadDashboard}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressPage />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            user={user}
            onUserUpdated={initApp}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Daily Check-in Modal */}
      <DailyCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onCheckinComplete={loadDashboard}
        todayDateStr={todayStr}
      />

      {/* 2. Focused Task Execution Modal */}
      {executingTask && (
        <TaskExecutionModal
          task={executingTask}
          isOpen={!!executingTask}
          onClose={() => setExecutingTask(null)}
          onTaskUpdated={loadDashboard}
        />
      )}

      {/* 3. First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          initApp();
        }}
      />
    </div>
  );
}

export default App;
