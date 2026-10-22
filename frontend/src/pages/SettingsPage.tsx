import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Calendar, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Moon, 
  Sun, 
  Clock, 
  Bell,
  CheckCircle2
} from 'lucide-react';
import { api, UserProfile, FixedEvent } from '../api/client';

interface SettingsPageProps {
  user: UserProfile | null;
  onUserUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUserUpdated }) => {
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [wakingTime, setWakingTime] = useState(user?.preferences?.waking_time || '07:30');
  const [sleepingTime, setSleepingTime] = useState(user?.preferences?.sleeping_time || '23:30');
  const [focusDuration, setFocusDuration] = useState(user?.preferences?.focus_duration || 45);
  const [breakDuration, setBreakDuration] = useState(user?.preferences?.break_duration || 10);
  const [phoneDistractionGuard, setPhoneDistractionGuard] = useState(user?.preferences?.phone_distraction_guard ?? true);
  const [distractionApps, setDistractionApps] = useState<string[]>(
    user?.preferences?.distraction_apps || ['Instagram Reels', 'YouTube Shorts', 'TikTok']
  );
  const [newAppInput, setNewAppInput] = useState('');

  // Fixed commitments
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTimezone(user.timezone || 'UTC');
      if (user.preferences) {
        setWakingTime(user.preferences.waking_time || '07:30');
        setSleepingTime(user.preferences.sleeping_time || '23:30');
        setFocusDuration(user.preferences.focus_duration || 45);
        setBreakDuration(user.preferences.break_duration || 10);
        setPhoneDistractionGuard(user.preferences.phone_distraction_guard ?? true);
        setDistractionApps(user.preferences.distraction_apps || ['Instagram Reels', 'YouTube Shorts']);
      }
    }
    loadFixedEvents();
  }, [user]);

  const loadFixedEvents = async () => {
    try {
      const res = await api.getFixedEvents();
      setFixedEvents(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateSettings({
        name,
        timezone,
        preferences: {
          waking_time: wakingTime,
          sleeping_time: sleepingTime,
          focus_duration: focusDuration,
          break_duration: breakDuration,
          phone_distraction_guard: phoneDistractionGuard,
          distraction_apps: distractionApps
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onUserUpdated();
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDistractionApp = () => {
    if (newAppInput.trim() && !distractionApps.includes(newAppInput.trim())) {
      setDistractionApps([...distractionApps, newAppInput.trim()]);
      setNewAppInput('');
    }
  };

  const handleRemoveApp = (app: string) => {
    setDistractionApps(distractionApps.filter((a) => a !== app));
  };

  const handleAddFixedEvent = async () => {
    if (!newEventTitle.trim() || !newEventStart || !newEventEnd) return;
    try {
      await api.createFixedEvent({
        title: newEventTitle.trim(),
        start_at: new Date(newEventStart).toISOString(),
        end_at: new Date(newEventEnd).toISOString(),
        recurrence_rule: 'WEEKDAYS'
      });
      setNewEventTitle('');
      setNewEventStart('');
      setNewEventEnd('');
      loadFixedEvents();
    } catch (err: any) {
      alert(`Error adding fixed event: ${err.message}`);
    }
  };

  const handleDeleteFixedEvent = async (id: number) => {
    try {
      await api.deleteFixedEvent(id);
      loadFixedEvents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Settings &amp; Boundaries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure waking boundaries, focus preferences, distraction shield, and protected commitments.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> Preferences Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            User Profile &amp; Time Zone
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Time Zone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Waking & Sleep Boundaries */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Protected Sleep &amp; Day Boundaries
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Orbit OS will strictly protect your sleep hours and never schedule deep work into this window.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Waking Time
              </label>
              <input
                type="time"
                value={wakingTime}
                onChange={(e) => setWakingTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Sleeping Time (Cutoff)
              </label>
              <input
                type="time"
                value={sleepingTime}
                onChange={(e) => setSleepingTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Focus Sprint Duration (mins)
              </label>
              <input
                type="number"
                min="15"
                max="90"
                value={focusDuration}
                onChange={(e) => setFocusDuration(parseInt(e.target.value) || 45)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Short Break Duration (mins)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 10)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Distraction Reduction Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Distraction Shield &amp; App Targets
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={phoneDistractionGuard}
                onChange={(e) => setPhoneDistractionGuard(e.target.checked)}
                className="rounded text-brand-500 focus:ring-0"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Guard Enabled</span>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Targeted distractions prompt short 90-second dopamine reset interventions instead of aimless doomscrolling.
          </p>

          <div className="flex flex-wrap gap-2">
            {distractionApps.map((app) => (
              <span
                key={app}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                {app}
                <button
                  type="button"
                  onClick={() => handleRemoveApp(app)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Add distracting app or site"
              value={newAppInput}
              onChange={(e) => setNewAppInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddDistractionApp}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save All Preferences'}
          </button>
        </div>
      </form>

      {/* Protected Fixed Commitments (University / Work Standups) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Protected Fixed Commitments (Classes, Work, Travel)
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Fixed commitments are strictly reserved first by the constraint-based scheduler with zero overlaps allowed.
        </p>

        {/* Existing events */}
        <div className="space-y-2">
          {fixedEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No fixed commitments added yet.</p>
          ) : (
            fixedEvents.map((fe) => (
              <div
                key={fe.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{fe.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    {new Date(fe.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(fe.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {fe.recurrence_rule || 'One-time'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFixedEvent(fe.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new fixed event */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Fixed Commitment</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="e.g. Operating Systems Lecture"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="datetime-local"
              value={newEventStart}
              onChange={(e) => setNewEventStart(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="datetime-local"
              value={newEventEnd}
              onChange={(e) => setNewEventEnd(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleAddFixedEvent}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Protected Commitment
          </button>
        </div>
      </div>
    </div>
  );
};
