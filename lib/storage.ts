import { JournalEntry, WeeklyInsight, UserSettings, JournalMessage } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

const ENTRIES_KEY = 'chipmind_journal_entries';
const INSIGHTS_KEY = 'chipmind_journal_insights';
const SETTINGS_KEY = 'chipmind_journal_settings';
const DRAFT_KEY = 'chipmind_active_draft';

export interface JournalDraft {
  promptId: string | null;
  promptTitle?: string;
  messages: JournalMessage[];
  inputText: string;
  photos?: string[];
  updatedAt: string;
}

export const getStoredDraft = (): JournalDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredDraft = (draft: Partial<JournalDraft>): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredDraft() || {
      promptId: null,
      promptTitle: '',
      messages: [],
      inputText: '',
      updatedAt: new Date().toISOString(),
    };
    const updated = { ...current, ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save draft:', err);
  }
};

export const clearStoredDraft = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.warn('Failed to clear draft:', err);
  }
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Friend',
  geminiApiKey: '',
  passcodeEnabled: false,
  reflectionStyle: 'socratic',
};

// --- SETTINGS ---
export const getStoredSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw =
      localStorage.getItem(SETTINGS_KEY) ||
      localStorage.getItem('rosebud_journal_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: Partial<UserSettings>): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('chipmind_storage_update'));
  }
  return updated;
};

// --- ENTRIES (WITH BI-DIRECTIONAL CLOUD SYNC & MIGRATION) ---
export const fetchEntries = async (): Promise<JournalEntry[]> => {
  if (typeof window === 'undefined') return [];

  // 1. Read cached local entries
  let localEntries: JournalEntry[] = [];
  try {
    const raw =
      localStorage.getItem(ENTRIES_KEY) ||
      localStorage.getItem('rosebud_journal_entries');
    if (raw) localEntries = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local entries:', err);
  }

  // If Supabase is not configured, rely on local storage
  if (!isSupabaseConfigured()) {
    return localEntries;
  }

  // 2. Supabase is configured: fetch cloud entries
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return localEntries;

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch entries error:', error);
      return localEntries;
    }

    const cloudEntries: JournalEntry[] = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      content: item.content,
      summary: item.summary || '',
      moodScore: item.mood_score || 5,
      emotions: item.emotions || [],
      tags: item.tags || [],
      actionItems: item.action_items || [],
      conversation: item.conversation || [],
      photos: item.photos || [],
      promptUsed: item.prompt_used,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    // 3. Auto-migration: If this device has local entries not yet in cloud, upload them!
    const cloudIdMap = new Map(cloudEntries.map((e) => [e.id, e]));
    const unSyncedLocal = localEntries.filter((e) => !cloudIdMap.has(e.id));

    if (unSyncedLocal.length > 0) {
      for (const entry of unSyncedLocal) {
        try {
          await supabase.from('entries').upsert({
            id: entry.id,
            title: entry.title,
            date: entry.date
              ? entry.date.split('T')[0]
              : new Date().toISOString().split('T')[0],
            content: entry.content || '',
            summary: entry.summary || '',
            mood_score: entry.moodScore || 5,
            emotions: entry.emotions || [],
            tags: entry.tags || [],
            action_items: entry.actionItems || [],
            conversation: entry.conversation || [],
            photos: entry.photos || [],
            prompt_used: entry.promptUsed || '',
            created_at: entry.createdAt || new Date().toISOString(),
            updated_at: entry.updatedAt || new Date().toISOString(),
          });
          cloudEntries.push(entry);
        } catch (syncErr) {
          console.warn('Failed to auto-sync local entry to Supabase:', entry.id, syncErr);
        }
      }
    }

    // Sort descending by created_at or date
    cloudEntries.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    });

    // 4. Update local cache
    try {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(cloudEntries));
      localStorage.setItem('rosebud_journal_entries', JSON.stringify(cloudEntries));
    } catch (cacheErr) {
      console.warn('Failed to update local cache:', cacheErr);
    }

    return cloudEntries;
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to local storage:', err);
    return localEntries;
  }
};

export const saveEntry = async (entry: JournalEntry): Promise<void> => {
  if (typeof window === 'undefined') return;

  // 1. Save locally first (instant UI update)
  try {
    const raw =
      localStorage.getItem(ENTRIES_KEY) ||
      localStorage.getItem('rosebud_journal_entries');
    const existing: JournalEntry[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((e) => e.id === entry.id);
    let updated: JournalEntry[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = entry;
    } else {
      updated = [entry, ...existing];
    }
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
    localStorage.setItem('rosebud_journal_entries', JSON.stringify(updated));
    clearStoredDraft();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('chipmind_storage_update'));
    }
  } catch (err) {
    console.error('Failed to save entry locally:', err);
  }

  // 2. Sync to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('entries').upsert({
          id: entry.id,
          title: entry.title,
          date: entry.date
            ? entry.date.split('T')[0]
            : new Date().toISOString().split('T')[0],
          content: entry.content || '',
          summary: entry.summary || '',
          mood_score: entry.moodScore || 5,
          emotions: entry.emotions || [],
          tags: entry.tags || [],
          action_items: entry.actionItems || [],
          conversation: entry.conversation || [],
          photos: entry.photos || [],
          prompt_used: entry.promptUsed || '',
          created_at: entry.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          console.error('Supabase upsert error:', error);
        }
      }
    } catch (err) {
      console.warn('Supabase sync failed (persisted locally):', err);
    }
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const raw =
      localStorage.getItem(ENTRIES_KEY) ||
      localStorage.getItem('rosebud_journal_entries');
    const existing: JournalEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((e) => e.id !== id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    localStorage.setItem('rosebud_journal_entries', JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('chipmind_storage_update'));
    }
  } catch (err) {
    console.error('Failed to delete local entry:', err);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('entries').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
        }
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }
};

// --- WEEKLY INSIGHTS (WITH BI-DIRECTIONAL CLOUD SYNC) ---
export const fetchWeeklyInsights = async (): Promise<WeeklyInsight[]> => {
  if (typeof window === 'undefined') return [];

  let localInsights: WeeklyInsight[] = [];
  try {
    const raw =
      localStorage.getItem(INSIGHTS_KEY) ||
      localStorage.getItem('rosebud_journal_insights');
    if (raw) localInsights = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local insights:', err);
  }

  if (!isSupabaseConfigured()) {
    return localInsights;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return localInsights;

    const { data, error } = await supabase
      .from('weekly_insights')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch weekly insights error:', error);
      return localInsights;
    }

    const cloudInsights: WeeklyInsight[] = (data || []).map((item) => ({
      id: item.id,
      weekStartDate: item.week_start_date,
      weekEndDate: item.week_end_date,
      title: item.title,
      summary: item.summary,
      topThemes: item.top_themes || [],
      growthAreas: item.growth_areas || [],
      wins: item.wins || [],
      keyMindsetShift: item.key_mindset_shift || '',
      recommendedFocus: item.recommended_focus || '',
      createdAt: item.created_at,
    }));

    // Auto-migration for insights
    const cloudIdMap = new Map(cloudInsights.map((i) => [i.id, i]));
    const unSyncedLocal = localInsights.filter((i) => !cloudIdMap.has(i.id));

    if (unSyncedLocal.length > 0) {
      for (const insight of unSyncedLocal) {
        try {
          await supabase.from('weekly_insights').upsert({
            id: insight.id,
            week_start_date: insight.weekStartDate
              ? insight.weekStartDate.split('T')[0]
              : new Date().toISOString().split('T')[0],
            week_end_date: insight.weekEndDate
              ? insight.weekEndDate.split('T')[0]
              : new Date().toISOString().split('T')[0],
            title: insight.title,
            summary: insight.summary,
            top_themes: insight.topThemes || [],
            growth_areas: insight.growthAreas || [],
            wins: insight.wins || [],
            key_mindset_shift: insight.keyMindsetShift || '',
            recommended_focus: insight.recommendedFocus || '',
            created_at: insight.createdAt || new Date().toISOString(),
          });
          cloudInsights.push(insight);
        } catch (syncErr) {
          console.warn('Failed to auto-sync local insight to Supabase:', insight.id, syncErr);
        }
      }
    }

    cloudInsights.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    try {
      localStorage.setItem(INSIGHTS_KEY, JSON.stringify(cloudInsights));
      localStorage.setItem('rosebud_journal_insights', JSON.stringify(cloudInsights));
    } catch {
      // ignore
    }

    return cloudInsights;
  } catch (err) {
    console.warn('Supabase fetch insights failed, falling back to local storage:', err);
    return localInsights;
  }
};

export const saveWeeklyInsight = async (insight: WeeklyInsight): Promise<void> => {
  if (typeof window === 'undefined') return;

  // 1. Save locally
  try {
    const raw =
      localStorage.getItem(INSIGHTS_KEY) ||
      localStorage.getItem('rosebud_journal_insights');
    const existing: WeeklyInsight[] = raw ? JSON.parse(raw) : [];
    const updated = [insight, ...existing.filter((i) => i.id !== insight.id)];
    localStorage.setItem(INSIGHTS_KEY, JSON.stringify(updated));
    localStorage.setItem('rosebud_journal_insights', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('chipmind_storage_update'));
    }
  } catch (err) {
    console.error('Failed to save weekly insight locally:', err);
  }

  // 2. Sync to Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('weekly_insights').upsert({
          id: insight.id,
          week_start_date: insight.weekStartDate
            ? insight.weekStartDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          week_end_date: insight.weekEndDate
            ? insight.weekEndDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          title: insight.title,
          summary: insight.summary,
          top_themes: insight.topThemes || [],
          growth_areas: insight.growthAreas || [],
          wins: insight.wins || [],
          key_mindset_shift: insight.keyMindsetShift || '',
          recommended_focus: insight.recommendedFocus || '',
          created_at: insight.createdAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Supabase weekly insight sync failed:', err);
    }
  }
};

// --- DATA EXPORT ---
export const exportJournalAsJSON = (entries: JournalEntry[]) => {
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `journal-backup-${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportJournalAsMarkdown = (entries: JournalEntry[]) => {
  let md = `# My Journal Export\nGenerated on ${new Date().toLocaleDateString()}\n\n---\n\n`;

  for (const entry of entries) {
    md += `## ${entry.title}\n`;
    md += `**Date**: ${new Date(entry.date).toLocaleDateString()} | **Mood**: ${entry.moodScore}/10\n`;
    if (entry.emotions.length) md += `**Emotions**: ${entry.emotions.join(', ')}\n`;
    if (entry.tags.length) md += `**Tags**: ${entry.tags.map((t) => `#${t}`).join(' ')}\n\n`;
    if (entry.summary) md += `> **Summary**: ${entry.summary}\n\n`;

    md += `### Content\n${entry.content}\n\n`;

    if (entry.actionItems && entry.actionItems.length > 0) {
      md += `### Action Commitments\n`;
      for (const item of entry.actionItems) {
        md += `- [ ] ${item}\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }

  const dataStr =
    'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `journal-export-${new Date().toISOString().slice(0, 10)}.md`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
