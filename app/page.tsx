'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Filter,
  Calendar,
  MessageSquare,
  TrendingUp,
  Key,
  BookmarkCheck,
  X
} from 'lucide-react';
import { JournalEntry, WeeklyInsight, UserSettings } from '@/lib/types';
import {
  fetchEntries,
  saveEntry,
  deleteEntry,
  fetchWeeklyInsights,
  saveWeeklyInsight,
  getStoredSettings,
  saveStoredSettings,
  getStoredDraft,
  clearStoredDraft,
  JournalDraft,
} from '@/lib/storage';
import { setRuntimeSupabaseConfig } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { InteractiveJournal } from '@/components/InteractiveJournal';
import { EntryCard } from '@/components/EntryCard';
import { MoodChart } from '@/components/MoodChart';
import { WeeklyReviewModal } from '@/components/WeeklyReviewModal';
import { SettingsModal } from '@/components/SettingsModal';
import { PasscodeLock } from '@/components/PasscodeLock';
import { LandingPage } from '@/components/LandingPage';
import { ChipMindLogo } from '@/components/ChipMindLogo';

export default function Home() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [activeTab, setActiveTab] = useState<'journal' | 'insights' | 'new'>('journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [activeDraft, setActiveDraft] = useState<JournalDraft | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [allowedEmail, setAllowedEmail] = useState('everythingfunny@gmail.com');
  const [googleClientId, setGoogleClientId] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Initialize data on client load
  useEffect(() => {
    const init = async () => {
      // 1. Check Session & Auth
      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setIsAuthenticated(Boolean(authData.authenticated));
          setCurrentUserEmail(authData.email || null);
          if (authData.allowedEmail) setAllowedEmail(authData.allowedEmail);
          if (authData.googleClientId) setGoogleClientId(authData.googleClientId);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsAuthChecking(false);
      }

      // 2. Check server environment config (Gemini API key & Supabase credentials)
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData?.hasServerKey) setHasServerKey(true);
          if (configData?.supabaseUrl && configData?.supabaseAnonKey) {
            setRuntimeSupabaseConfig(configData.supabaseUrl, configData.supabaseAnonKey);
          }
        }
      } catch (err) {
        console.warn('Config fetch error:', err);
      }

      const loadedSettings = getStoredSettings();
      setSettings(loadedSettings);
      if (loadedSettings.passcodeEnabled && loadedSettings.passcodeHash) {
        setIsLocked(true);
      }

      const loadedEntries = await fetchEntries();
      setEntries(loadedEntries);

      const loadedInsights = await fetchWeeklyInsights();
      setInsights(loadedInsights);

      const currentDraft = getStoredDraft();
      if (currentDraft && (currentDraft.messages.length > 0 || currentDraft.inputText.trim())) {
        setActiveDraft(currentDraft);
      }

      setIsLoading(false);
    };

    init();

    // Listen for storage events across components and tabs
    const handleStorageUpdate = async () => {
      const refreshedEntries = await fetchEntries();
      setEntries(refreshedEntries);
      const draft = getStoredDraft();
      setActiveDraft(
        draft && (draft.messages.length > 0 || draft.inputText.trim()) ? draft : null
      );
    };

    window.addEventListener('chipmind_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('chipmind_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const handleSaveEntry = async (entry: JournalEntry) => {
    await saveEntry(entry);
    const updated = await fetchEntries();
    setEntries(updated);
    setActiveTab('journal');
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    const updated = await fetchEntries();
    setEntries(updated);
  };

  const handleSaveInsight = async (insight: WeeklyInsight) => {
    await saveWeeklyInsight(insight);
    const updated = await fetchWeeklyInsights();
    setInsights(updated);
  };

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = saveStoredSettings(newSettings);
    setSettings(updated);
  };

  // Collect all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  ).slice(0, 8);

  // Filter entries by search and tag
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'all' || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
  };

  // Loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="text-center space-y-3">
          <ChipMindLogo size={48} glow={true} className="mx-auto" />
          <p className="text-xs font-mono text-cyan-400 tracking-widest animate-pulse">
            INITIALIZING NEURAL CODEX...
          </p>
        </div>
      </div>
    );
  }

  // Show public Welcome Landing Page if not authenticated
  if (!isAuthenticated) {
    return (
      <LandingPage
        onLoginSuccess={(email) => {
          setIsAuthenticated(true);
          setCurrentUserEmail(email);
        }}
        allowedEmail={allowedEmail}
        googleClientId={googleClientId}
      />
    );
  }

  // Passcode lock screen if active
  if (isLocked) {
    return (
      <PasscodeLock
        correctHash={settings.passcodeHash}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={
          settings.passcodeEnabled ? () => setIsLocked(true) : undefined
        }
        onLogout={handleLogout}
        userEmail={currentUserEmail}
        passcodeEnabled={settings.passcodeEnabled}
        entryCount={entries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* TAB 1: NEW INTERACTIVE REFLECTION */}
        {activeTab === 'new' && (
          <InteractiveJournal
            apiKey={settings.geminiApiKey}
            reflectionStyle={settings.reflectionStyle}
            onSaveEntry={handleSaveEntry}
            onCancel={() => setActiveTab('journal')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* TAB 2: INSIGHTS & MOOD TELEMETRY */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight">
                  Personal Telemetry &amp; Metrics
                </h1>
                <p className="text-xs sm:text-sm font-mono text-cyan-400/80 mt-1">
                  Analyzing emotional frequency, cognitive patterns, and growth syntheses
                </p>
              </div>

              <button
                onClick={() => setIsWeeklyReviewOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Compile Weekly AI Synthesis</span>
              </button>
            </div>

            <MoodChart entries={entries} />

            {/* Past Weekly Insights Feed */}
            {insights.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#1e293b]">
                <h2 className="text-base font-sans font-bold text-white tracking-tight">
                  Archived Syntheses
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="bg-[#101626] p-5 rounded-3xl border border-[#1e293b] hover:border-purple-500/40 transition-all space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-purple-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(insight.weekStartDate).toLocaleDateString()} &mdash;{' '}
                          {new Date(insight.weekEndDate).toLocaleDateString()}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-300 text-[11px] font-mono font-bold border border-purple-500/30">
                          AI SYNTHESIS
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-lg text-white">
                        {insight.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {insight.summary}
                      </p>
                      {insight.keyMindsetShift && (
                        <div className="p-3 rounded-2xl bg-[#0d1322] border border-purple-500/20 text-xs font-mono text-purple-200 italic">
                          &ldquo;{insight.keyMindsetShift}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOURNAL TIMELINE & FEED */}
        {activeTab === 'journal' && (
          <div className="space-y-6 animate-fadeIn">
            {/* API Key prompt banner if missing */}
            {!settings.geminiApiKey && !hasServerKey && (
              <div className="p-4 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-amber-900/60 text-amber-400 border border-amber-500/30">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      Configure your free Gemini API Key for neural mirror reflection
                    </h4>
                    <p className="text-[11px] text-amber-200/80">
                      Unlocks unlimited Socratic feedback, reflection synthesis, and insights.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-full text-xs shrink-0 transition-colors shadow-sm"
                >
                  Configure in Settings
                </button>
              </div>
            )}

            {/* Draft Recovery Alert */}
            {activeDraft && (
              <div className="p-4 rounded-3xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 shadow-xs">
                    <BookmarkCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      Unsaved Reflection Draft Found in Cache
                    </h4>
                    <p className="text-[11px] text-cyan-300/80">
                      {activeDraft.inputText
                        ? `"${activeDraft.inputText.slice(0, 65)}..."`
                        : 'Unfinished thoughts stored from your previous session.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('new')}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors"
                  >
                    Resume Log
                  </button>
                  <button
                    onClick={() => {
                      clearStoredDraft();
                      setActiveDraft(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-full transition-colors"
                    title="Discard Draft"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Start a reflection quick hero card */}
            <div
              onClick={() => setActiveTab('new')}
              className="bg-gradient-to-r from-[#101626] via-[#131b2e] to-[#101626] p-5 sm:p-6 rounded-3xl border border-[#1e293b] hover:border-cyan-500/50 cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -z-0" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>INITIALIZE NEURAL REFLECTION</span>
                </div>
                <span className="text-xs font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
                  START &rarr;
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-sans text-white font-extrabold mb-1 tracking-tight relative z-10">
                What&apos;s compiling in your mind today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 relative z-10">
                Decompile raw thoughts with thoughtful Socratic inquiry, voice dictation, and photo memories.
              </p>
            </div>

            {/* Search & Tag Filter Bar */}
            {entries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search past reflections, logs, or keywords..."
                      className="w-full pl-9 pr-4 py-2.5 bg-[#101626] rounded-2xl border border-[#1e293b] focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-mono text-white placeholder-slate-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Filter tags pills */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-cyan-400" /> FILTER:
                    </span>
                    <button
                      onClick={() => setSelectedTag('all')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        selectedTag === 'all'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                          : 'bg-[#101626] border border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      ALL
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                          selectedTag === tag
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                            : 'bg-[#101626] border border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Entries Feed */}
            {isLoading ? (
              <div className="py-12 text-center text-xs font-mono text-cyan-400 animate-pulse">
                Decrypting and compiling your entries...
              </div>
            ) : filteredEntries.length > 0 ? (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </div>
            ) : entries.length > 0 ? (
              <div className="py-12 text-center bg-[#101626] rounded-3xl border border-[#1e293b] p-6">
                <p className="text-xs font-mono text-slate-400">
                  No logs found matching query &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="py-16 text-center bg-[#101626] rounded-3xl border border-[#1e293b] p-8 space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="font-sans font-bold text-lg text-white">
                    Codex is ready for its first entry
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Initialize your first conversation with the AI mirror. Decompile a thought, vent mental clutter, or set daily quests.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Log First Reflection</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        hasServerKey={hasServerKey}
        onSaveSettings={handleUpdateSettings}
        entries={entries}
      />

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        onClose={() => setIsWeeklyReviewOpen(false)}
        entries={entries}
        apiKey={settings.geminiApiKey}
        onSaveInsight={handleSaveInsight}
        existingInsights={insights}
      />
    </div>
  );
}
