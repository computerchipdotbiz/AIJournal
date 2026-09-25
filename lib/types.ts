export interface JournalMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string; // ISO date string
  content: string; // full aggregated text
  summary: string; // AI generated 1-2 sentence overview
  moodScore: number; // 1 to 10
  emotions: string[]; // e.g. ["calm", "optimistic", "exhausted"]
  tags: string[]; // e.g. ["work", "relationships", "mindset"]
  actionItems: string[]; // actionable takeaways
  conversation: JournalMessage[]; // full multi-turn transcript
  photos?: string[]; // base64 / data URLs of daily photos
  promptUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyInsight {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  title: string;
  summary: string;
  topThemes: string[];
  growthAreas: string[];
  wins: string[];
  keyMindsetShift: string;
  recommendedFocus: string;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  geminiApiKey: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  passcodeEnabled: boolean;
  passcodeHash?: string;
  reflectionStyle: 'cbt' | 'socratic' | 'gentle' | 'direct';
}

export interface JournalPrompt {
  id: string;
  title: string;
  subtitle: string;
  category: 'daily' | 'cbt' | 'growth' | 'evening';
  initialGreeting: string;
  icon: string;
}
