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
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Cloud,
  Cpu,
} from 'lucide-react';
import { UserSettings, JournalEntry } from '@/lib/types';
import { exportJournalAsJSON, exportJournalAsMarkdown } from '@/lib/storage';
import { SUPABASE_SCHEMA_SQL } from '@/lib/supabase/schemaSql';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase/client';

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
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySchemaInstructions = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101626] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#1e293b] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold font-mono text-white tracking-wide uppercase">
              System Settings &amp; Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151e34] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] px-6 bg-[#090d16] overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Neural Core</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supabase Cloud Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>PIN Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('hosting')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hosting'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Host &amp; DNS</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Codex Export</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm bg-[#101626]">
          {/* 1. AI CONFIGURATION */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {hasServerKey && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-mono">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>[ONLINE] Gemini API Key active via Vercel server environment.</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#1e293b] bg-[#090d16] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono text-white placeholder:text-slate-600"
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                  <span>Get your free key with 1M tokens/min at</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Therapeutic Reflection Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'socratic',
                      name: 'Socratic Inquiry',
                      desc: 'Asks probing questions to help uncover internal clarity.',
                    },
                    {
                      id: 'cbt',
                      name: 'CBT Reframing',
                      desc: 'Detects cognitive distortions, black-and-white thinking & reframes.',
                    },
                    {
                      id: 'gentle',
                      name: 'Gentle & Nurturing',
                      desc: 'Empathetic validation, emotional warmth, and pacing.',
                    },
                    {
                      id: 'direct',
                      name: 'Direct & Action-Oriented',
                      desc: 'Crisp, high-signal, highlights actionable choices.',
                    },
                  ].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setReflectionStyle(style.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        reflectionStyle === style.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-100 shadow-sm shadow-cyan-950/50'
                          : 'border-[#1e293b] bg-[#090d16] hover:border-[#334155] text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>{style.name}</span>
                        {reflectionStyle === style.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
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
              {isSupabaseConfigured() ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5 font-mono">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-300 uppercase tracking-wide">
                      Multi-Device Cloud Telemetry Online
                    </div>
                    <div className="text-emerald-400/80 text-[11px] mt-0.5 font-sans">
                      Entries and memory snapshots sync seamlessly across your phone, laptop, and battlestation desktop.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5 font-mono">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-300 uppercase tracking-wide">
                      Local Storage Cache Only
                    </div>
                    <div className="text-amber-400/80 text-[11px] mt-0.5 font-sans">
                      Entries are stored in this browser only. Connect Supabase below so all your rigs see the same codex.
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Step Setup Guide */}
              <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1e293b] text-xs space-y-2 font-mono">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Device Database Synchronization</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] font-sans">
                  <li>
                    Create a free project at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline font-medium"
                    >
                      supabase.com
                    </a>{' '}
                    (100% free tier, instant setup).
                  </li>
                  <li>
                    Open <strong>SQL Editor &rarr; New Query</strong>, paste the schema script below, and click <strong>Run</strong>.
                  </li>
                  <li>
                    Copy your <strong>Project URL</strong> and <strong>Anon Key</strong> into the fields below or into Vercel Environment Variables.
                  </li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Database SQL Schema</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
                  >
                    Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchemaInstructions}
                  className="w-full py-2.5 px-3 text-xs bg-[#090d16] hover:bg-[#151e34] text-cyan-300 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-mono font-medium border border-[#1e293b]"
                >
                  {copiedSchema ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>
                    {copiedSchema
                      ? '✓ Complete SQL Script Copied to Clipboard!'
                      : 'Copy SQL Setup Script (Paste in Supabase SQL Editor)'}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => {
                    setSupabaseUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#1e293b] bg-[#090d16] focus:border-cyan-500 focus:outline-none text-xs font-mono text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => {
                    setSupabaseKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#1e293b] bg-[#090d16] focus:border-cyan-500 focus:outline-none text-xs font-mono text-white placeholder:text-slate-600"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 font-mono ${
                    testResult.success
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>{testResult.message}</div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !supabaseUrl.trim() || !supabaseKey.trim()}
                  className="px-4 py-2 text-xs border border-[#1e293b] hover:border-cyan-500/60 bg-[#090d16] hover:bg-[#151e34] text-cyan-300 rounded-xl flex items-center gap-1.5 transition-colors font-mono font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{isTesting ? 'Testing Link...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. PASSCODE PRIVACY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#090d16] border border-[#1e293b]">
                <div>
                  <div className="font-semibold text-xs text-white font-mono">
                    Device Security Lock
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Require secret PIN whenever opening the app
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={passcodeEnabled}
                  onChange={(e) => setPasscodeEnabled(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {passcodeEnabled && (
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Set Security PIN
                  </label>
                  <input
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Enter 4-digit or text PIN..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1e293b] bg-[#090d16] focus:border-cyan-500 focus:outline-none text-sm tracking-widest font-mono text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Keep this code safe. It guards your reflections on this device.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. CUSTOM DOMAIN & FREE HOSTING GUIDE */}
          {activeTab === 'hosting' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 leading-relaxed font-mono">
                <div className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Free Vercel Cloud Node + SSL Custom Domain</span>
                </div>
                Zero cost hosting with automated edge deployment, HTTPS SSL certificates, and custom apex/subdomain routing.
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl border border-[#1e293b] bg-[#090d16]">
                  <span className="font-semibold text-white block mb-1 font-mono text-cyan-300">
                    Step 1: Push code to GitHub
                  </span>
                  Create a private GitHub repository and push your project branch.
                </div>

                <div className="p-3.5 rounded-xl border border-[#1e293b] bg-[#090d16]">
                  <span className="font-semibold text-white block mb-1 font-mono text-cyan-300">
                    Step 2: Connect to Vercel
                  </span>
                  Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium">vercel.com</a>, log in with GitHub, select your repository, and set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`).
                </div>

                <div className="p-3.5 rounded-xl border border-[#1e293b] bg-[#090d16]">
                  <span className="font-semibold text-white block mb-1 font-mono text-cyan-300">
                    Step 3: Route Your Custom Domain
                  </span>
                  In your Vercel project, navigate to <strong>Settings &rarr; Domains</strong>, add your custom domain (e.g. `journal.yourdomain.com`), and configure the DNS CNAME/A records. Active within 60 seconds!
                </div>
              </div>
            </div>
          )}

          {/* 5. EXPORT DATA */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-mono">
                Full data ownership. Download your unencrypted telemetry reflections and metadata at any time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => exportJournalAsMarkdown(entries)}
                  className="p-4 rounded-xl border border-[#1e293b] hover:border-cyan-500/50 text-left transition-all group flex items-start gap-3 bg-[#090d16]"
                >
                  <div className="p-2 rounded-lg bg-[#101626] text-cyan-400 border border-[#1e293b] shadow-xs group-hover:border-cyan-500/50">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white font-mono group-hover:text-cyan-300 transition-colors">
                      Export Markdown (.md)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Formatted readable text for Obsidian, Notion, or local archives.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => exportJournalAsJSON(entries)}
                  className="p-4 rounded-xl border border-[#1e293b] hover:border-cyan-500/50 text-left transition-all group flex items-start gap-3 bg-[#090d16]"
                >
                  <div className="p-2 rounded-lg bg-[#101626] text-cyan-400 border border-[#1e293b] shadow-xs group-hover:border-cyan-500/50">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white font-mono group-hover:text-cyan-300 transition-colors">
                      Export JSON (.json)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Complete raw database snapshot with telemetry nodes and photos.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1e293b] flex items-center justify-between bg-[#0d1322]">
          <div className="text-xs text-emerald-400 font-mono font-medium">
            {savedSuccess && '✓ Configurations committed successfully!'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              Commit Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
