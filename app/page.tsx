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
  Key
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
} from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { InteractiveJournal } from '@/components/InteractiveJournal';
import { EntryCard } from '@/components/EntryCard';
import { MoodChart } from '@/components/MoodChart';
import { WeeklyReviewModal } from '@/components/WeeklyReviewModal';
import { SettingsModal } from '@/components/SettingsModal';
import { PasscodeLock } from '@/components/PasscodeLock';

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

  // Initialize data on client load
  useEffect(() => {
    const init = async () => {
      // Check if server environment variable has GEMINI_API_KEY
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.hasServerKey) setHasServerKey(true);
        })
        .catch(() => {});

      const loadedSettings = getStoredSettings();
      setSettings(loadedSettings);
      if (loadedSettings.passcodeEnabled && loadedSettings.passcodeHash) {
        setIsLocked(true);
      }

      const loadedEntries = await fetchEntries();
      setEntries(loadedEntries);

      const loadedInsights = await fetchWeeklyInsights();
      setInsights(loadedInsights);

      setIsLoading(false);
    };

    init();
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
    <div className="min-h-screen bg-[#fcfbf9] text-[#1f2421] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={
          settings.passcodeEnabled ? () => setIsLocked(true) : undefined
        }
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

        {/* TAB 2: INSIGHTS & MOOD TRENDS */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#1f2421]">
                  Personal Growth Insights
                </h1>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                  Track emotional trends, habits, and AI pattern recognition
                </p>
              </div>

              <button
                onClick={() => setIsWeeklyReviewOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Weekly AI Synthesis</span>
              </button>
            </div>

            <MoodChart entries={entries} />

            {/* Past Weekly Insights Feed */}
            {insights.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#ebe7df]">
                <h2 className="text-base font-serif font-semibold text-[#1f2421]">
                  Past Syntheses
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="bg-white p-5 rounded-3xl border border-[#ebe7df] space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-[#64748b]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#5b7065]" />
                          {new Date(insight.weekStartDate).toLocaleDateString()} &mdash;{' '}
                          {new Date(insight.weekEndDate).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                          AI Review
                        </span>
                      </div>
                      <h3 className="font-serif font-semibold text-lg text-[#1f2421]">
                        {insight.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#475569] leading-relaxed line-clamp-3">
                        {insight.summary}
                      </p>
                      {insight.keyMindsetShift && (
                        <div className="p-3 rounded-2xl bg-[#e8edea]/60 text-xs text-[#2c4035] italic">
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
              <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-amber-100 text-amber-700">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-900">
                      Add your free Gemini API Key for AI reflections
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Get unlimited free Socratic feedback and automated summaries in seconds.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold shrink-0 transition-colors"
                >
                  Configure in Settings
                </button>
              </div>
            )}

            {/* Start a reflection quick card */}
            <div
              onClick={() => setActiveTab('new')}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-[#ebe7df] hover:border-[#5b7065]/40 cursor-pointer shadow-xs hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#5b7065]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Interactive Reflection</span>
                </div>
                <span className="text-xs text-[#64748b] group-hover:text-[#5b7065] transition-colors">
                  Tap to begin &rarr;
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif text-[#1f2421] font-semibold mb-1">
                What&apos;s on your mind today?
              </h2>
              <p className="text-xs sm:text-sm text-[#64748b]">
                Reflect with thoughtful Socratic questions, voice dictation, and emotional clarity.
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
                      placeholder="Search past thoughts, summaries, or keywords..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none focus:ring-2 focus:ring-[#5b7065]/15 text-xs text-[#1f2421]"
                    />
                    <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Filter tags pills */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] text-[#64748b] mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Filter:
                    </span>
                    <button
                      onClick={() => setSelectedTag('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedTag === 'all'
                          ? 'bg-[#5b7065] text-white'
                          : 'bg-white border border-[#ebe7df] text-[#64748b] hover:bg-[#f5f2eb]'
                      }`}
                    >
                      All
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedTag === tag
                            ? 'bg-[#5b7065] text-white'
                            : 'bg-white border border-[#ebe7df] text-[#64748b] hover:bg-[#f5f2eb]'
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
              <div className="py-12 text-center text-xs text-[#64748b]">
                Loading your reflections...
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
              <div className="py-12 text-center bg-white rounded-3xl border border-[#ebe7df] p-6">
                <p className="text-xs text-[#64748b]">
                  No journal entries found matching &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl border border-[#ebe7df] p-8 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-[#e8edea] text-[#5b7065] flex items-center justify-center">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="font-serif font-semibold text-lg text-[#1f2421]">
                    Your journal is a blank canvas
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1">
                    Start your first conversation with the AI mirror. Write a thought, unload mental clutter, or set morning intentions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-6 py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full font-medium text-xs shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write First Reflection</span>
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
