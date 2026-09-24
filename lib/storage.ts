import { JournalEntry, WeeklyInsight, UserSettings } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

const ENTRIES_KEY = 'rosebud_journal_entries';
const INSIGHTS_KEY = 'rosebud_journal_insights';
const SETTINGS_KEY = 'rosebud_journal_settings';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Friend',
  geminiApiKey: '',
  passcodeEnabled: false,
  reflectionStyle: 'socratic'
};

// --- SETTINGS ---
export const getStoredSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
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
  return updated;
};

// --- ENTRIES ---
export const fetchEntries = async (): Promise<JournalEntry[]> => {
  if (typeof window === 'undefined') return [];

  // Check Supabase first if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(item => ({
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
            promptUsed: item.prompt_used,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveEntry = async (entry: JournalEntry): Promise<void> => {
  if (typeof window === 'undefined') return;

  // 1. Save locally
  try {
    const existing = await fetchEntries();
    const index = existing.findIndex(e => e.id === entry.id);
    let updated: JournalEntry[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = entry;
    } else {
      updated = [entry, ...existing];
    }
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save entry locally:', err);
  }

  // 2. Sync to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('entries').upsert({
          id: entry.id,
          title: entry.title,
          date: entry.date.split('T')[0],
          content: entry.content,
          summary: entry.summary,
          mood_score: entry.moodScore,
          emotions: entry.emotions,
          tags: entry.tags,
          action_items: entry.actionItems,
          conversation: entry.conversation,
          prompt_used: entry.promptUsed,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Supabase sync failed (will persist locally):', err);
    }
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const existing = await fetchEntries();
    const filtered = existing.filter(e => e.id !== id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete local entry:', err);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('entries').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }
};

// --- WEEKLY INSIGHTS ---
export const fetchWeeklyInsights = async (): Promise<WeeklyInsight[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INSIGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWeeklyInsight = async (insight: WeeklyInsight): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const existing = await fetchWeeklyInsights();
    const updated = [insight, ...existing.filter(i => i.id !== insight.id)];
    localStorage.setItem(INSIGHTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save weekly insight:', err);
  }
};

// --- DATA EXPORT ---
export const exportJournalAsJSON = (entries: JournalEntry[]) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `journal-backup-${new Date().toISOString().slice(0, 10)}.json`);
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
    if (entry.tags.length) md += `**Tags**: ${entry.tags.map(t => `#${t}`).join(' ')}\n\n`;
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

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `journal-export-${new Date().toISOString().slice(0, 10)}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
