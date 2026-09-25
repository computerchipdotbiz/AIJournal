'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  Database,
  Lock,
  Download,
  Globe,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { UserSettings, JournalEntry } from '@/lib/types';
import { exportJournalAsJSON, exportJournalAsMarkdown } from '@/lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  hasServerKey?: boolean;
  onSaveSettings: (settings: Partial<UserSettings>) => void;
  entries: JournalEntry[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  hasServerKey = false,
  onSaveSettings,
  entries,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'database' | 'security' | 'hosting' | 'export'>('ai');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [reflectionStyle, setReflectionStyle] = useState(settings.reflectionStyle || 'socratic');
  const [passcodeEnabled, setPasscodeEnabled] = useState(settings.passcodeEnabled || false);
  const [newPasscode, setNewPasscode] = useState(settings.passcodeHash || '');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseAnonKey || '');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      geminiApiKey: geminiKey.trim(),
      reflectionStyle: reflectionStyle as 'cbt' | 'socratic' | 'gentle' | 'direct',
      passcodeEnabled: passcodeEnabled,
      passcodeHash: newPasscode.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopySchemaInstructions = () => {
    navigator.clipboard.writeText(
      `-- Go to Supabase -> SQL Editor and run the script in lib/supabase/schema.sql`
    );
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl border border-[#ebe7df] shadow-xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#ebe7df] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold font-serif text-[#1f2421]">
              Journal Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94a3b8] hover:text-[#1f2421] rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#ebe7df] px-6 bg-[#fcfbf9] overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-[#5b7065] text-[#2c4035] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#1f2421]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-[#5b7065] text-[#2c4035] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#1f2421]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-[#5b7065] text-[#2c4035] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#1f2421]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Passcode Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('hosting')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hosting'
                ? 'border-[#5b7065] text-[#2c4035] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#1f2421]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Custom Domain & Free Host</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-[#5b7065] text-[#2c4035] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#1f2421]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {/* 1. AI CONFIGURATION */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {hasServerKey && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gemini API Key is active from your Vercel server environment.</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none focus:ring-2 focus:ring-[#5b7065]/20 text-xs font-mono"
                    />
                    <Key className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <p className="text-xs text-[#64748b] mt-1.5 flex items-center gap-1">
                  <span>Get your free key with 1M tokens/min at</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5b7065] hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
                  Therapeutic Reflection Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'socratic',
                      name: 'Socratic Inquiry',
                      desc: 'Asks probing questions to help uncover your own clarity.',
                    },
                    {
                      id: 'cbt',
                      name: 'CBT Reframing',
                      desc: 'Spots cognitive distortions, catastrophic thinking & reframes.',
                    },
                    {
                      id: 'gentle',
                      name: 'Gentle & Nurturing',
                      desc: 'Deep emotional warmth, acceptance, and gentle pacing.',
                    },
                    {
                      id: 'direct',
                      name: 'Direct & Action-Oriented',
                      desc: 'Concise, clear, and highlights practical decisions.',
                    },
                  ].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setReflectionStyle(style.id as any)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        reflectionStyle === style.id
                          ? 'border-[#5b7065] bg-[#e8edea]/40 text-[#1f2421]'
                          : 'border-[#ebe7df] hover:border-gray-300 text-[#475569]'
                      }`}
                    >
                      <div className="font-semibold text-xs text-[#1f2421]">
                        {style.name}
                      </div>
                      <div className="text-[11px] text-[#64748b] mt-0.5">
                        {style.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. SUPABASE CLOUD SYNC */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#fcfbf9] border border-[#ebe7df] text-xs text-[#475569] leading-relaxed">
                <span className="font-semibold text-[#1f2421]">Local-First Ready: </span>
                Your journal entries are automatically stored safely in your browser. Connecting Supabase gives you automatic multi-device cloud backups and AI semantic memory across past entries.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2 rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none text-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-[#64748b] mb-1">
                  <span>Database Table Schema</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5b7065] hover:underline flex items-center gap-1 font-medium"
                  >
                    Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchemaInstructions}
                  className="w-full py-2 px-3 text-xs bg-[#f5f2eb] hover:bg-[#ebe7df] text-[#1f2421] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedSchema ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#5b7065]" />}
                  <span>{copiedSchema ? 'SQL file reference copied!' : 'View schema: lib/supabase/schema.sql'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. PASSCODE PRIVACY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fcfbf9] border border-[#ebe7df]">
                <div>
                  <div className="font-semibold text-xs text-[#1f2421]">
                    Passcode Lock
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Require a PIN whenever opening the app
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={passcodeEnabled}
                  onChange={(e) => setPasscodeEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#5b7065] cursor-pointer"
                />
              </div>

              {passcodeEnabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                    Set Your Secret Passcode
                  </label>
                  <input
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Enter 4-digit or text PIN..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none text-sm tracking-widest font-mono"
                  />
                  <p className="text-[11px] text-[#94a3b8] mt-1">
                    Remember this code. It guards your reflections on this device.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. CUSTOM DOMAIN & FREE HOSTING GUIDE */}
          {activeTab === 'hosting' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-950 leading-relaxed">
                <div className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Free Hosting + Free Custom Domain</span>
                </div>
                Deploying to Vercel costs $0/month forever and includes free automated SSL (HTTPS) for any domain name you own.
              </div>

              <div className="space-y-3 text-xs text-[#334155]">
                <div className="p-3.5 rounded-2xl border border-[#ebe7df]">
                  <span className="font-semibold text-[#1f2421] block mb-1">
                    Step 1: Push code to GitHub
                  </span>
                  Create a private GitHub repository and push this project folder.
                </div>

                <div className="p-3.5 rounded-2xl border border-[#ebe7df]">
                  <span className="font-semibold text-[#1f2421] block mb-1">
                    Step 2: Connect to Vercel (Free)
                  </span>
                  Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#5b7065] underline font-medium">vercel.com</a>, log in with GitHub, click &ldquo;Add New Project&rdquo;, and select your repository. Add your `GEMINI_API_KEY` to Environment Variables.
                </div>

                <div className="p-3.5 rounded-2xl border border-[#ebe7df]">
                  <span className="font-semibold text-[#1f2421] block mb-1">
                    Step 3: Add Your Custom Domain
                  </span>
                  In your Vercel project dashboard, go to <strong>Settings &rarr; Domains</strong>, type your domain (e.g. `journal.yourname.com` or `yourdomain.com`), and add the 2 DNS records shown to your domain registrar (Namecheap, Cloudflare, etc.). Vercel verifies and activates SSL in 60 seconds!
                </div>
              </div>
            </div>
          )}

          {/* 5. EXPORT DATA */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-[#64748b]">
                You own 100% of your data. You can download all your reflections, AI summaries, and moods at any time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => exportJournalAsMarkdown(entries)}
                  className="p-4 rounded-2xl border border-[#ebe7df] hover:border-[#5b7065] text-left transition-all group flex items-start gap-3 bg-[#fcfbf9]"
                >
                  <div className="p-2 rounded-xl bg-white text-[#5b7065] shadow-xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#1f2421]">
                      Export as Markdown (.md)
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Formatted readable text for Obsidian, Notion, or personal archives.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => exportJournalAsJSON(entries)}
                  className="p-4 rounded-2xl border border-[#ebe7df] hover:border-[#5b7065] text-left transition-all group flex items-start gap-3 bg-[#fcfbf9]"
                >
                  <div className="p-2 rounded-xl bg-white text-[#5b7065] shadow-xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#1f2421]">
                      Export as JSON (.json)
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Complete raw database backup with conversation logs.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#ebe7df] flex items-center justify-between bg-[#fcfbf9]">
          <div className="text-xs text-emerald-700 font-medium">
            {savedSuccess && '✓ Settings saved successfully!'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#64748b] hover:text-[#1f2421] font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
