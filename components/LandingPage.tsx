'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Mic,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import Script from 'next/script';
import { ChipMindLogo } from './ChipMindLogo';

interface LandingPageProps {
  onLoginSuccess: (email: string) => void;
  allowedEmail: string;
  googleClientId?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  allowedEmail,
  googleClientId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const renderedClientIdRef = useRef<string>('');

  const activeClientId = (
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  ).trim();

  // Initialize Google Identity Services when script loads and client ID exists
  useEffect(() => {
    const initGoogle = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (activeClientId && win.google?.accounts?.id && googleBtnRef.current) {
        try {
          win.google.accounts.id.initialize({
            client_id: activeClientId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback: async (response: any) => {
              if (response.credential) {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential: response.credential }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || 'Failed to authenticate with Google');
                  } else {
                    onLoginSuccess(data.email);
                  }
                } catch {
                  setError('Network error during Google sign in.');
                } finally {
                  setLoading(false);
                }
              }
            },
          });

          if (renderedClientIdRef.current !== activeClientId || googleBtnRef.current.children.length === 0) {
            googleBtnRef.current.innerHTML = '';
            win.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              width: 280,
            });
            renderedClientIdRef.current = activeClientId;
          }
        } catch (err) {
          console.error('Google Sign In Init Error:', err);
        }
      }
    };

    initGoogle();
    const interval = setInterval(initGoogle, 400);
    return () => clearInterval(interval);
  }, [activeClientId, scriptLoaded, onLoginSuccess]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPassword) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ownerPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect owner password');
      } else {
        onLoginSuccess(data.email);
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Background Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Header */}
      <header className="w-full border-b border-[#1e293b] bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ChipMindLogo size={36} glow={true} />
            <div className="flex flex-col">
              <span className="font-sans font-black text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                CHIPMIND
              </span>
              <span className="text-[10px] font-mono text-cyan-400/70 tracking-widest hidden sm:inline">
                NEURAL CODEX
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101626] border border-[#1e293b] text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEM SECURE</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-wider mb-6 animate-fadeIn shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>CLASSIFIED // PERSONAL COMMAND CODEX</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight max-w-2xl leading-tight sm:leading-tight mb-5 animate-fadeIn">
          Your personal AI neural journal &amp;{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
            reflection engine.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mb-10 animate-fadeIn">
          Engineered for tech minds. An active Socratic dialogue to decompile thoughts, analyze emotional patterns, and track personal growth across all your devices.
        </p>

        {/* Auth / Sign In Box */}
        <div className="w-full max-w-md bg-[#101626] p-6 sm:p-8 rounded-3xl border border-[#1e293b] shadow-2xl mb-16 text-left animate-fadeIn relative">
          {/* Subtle neon corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-tr-3xl blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="font-sans font-bold text-base text-white">
                Authorized Access
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
              LOCKED
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-5 leading-relaxed font-sans">
            Encrypted personal vault designated for{' '}
            <strong className="text-cyan-300 font-mono">{allowedEmail}</strong>.
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button Container */}
          <div className="space-y-3">
            {googleClientId ? (
              <div className="flex justify-center">
                <div ref={googleBtnRef} className="min-h-[44px]" />
              </div>
            ) : null}

            {/* Direct Authorized Login */}
            <div>
              {!showPasswordLogin ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordLogin(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authenticate with Access Key</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Secret Password
                    </label>
                    <input
                      type="password"
                      autoFocus
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Enter access password..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-[#090d16] border border-[#1e293b] focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-xs font-mono text-white placeholder-slate-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !ownerPassword}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlock Vault</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordLogin(false)}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left w-full max-w-4xl">
          <div className="p-6 rounded-3xl bg-[#101626] border border-[#1e293b] hover:border-cyan-500/40 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-base text-white mb-1.5">
              Socratic Processing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spew raw thoughts and build logs. The AI analyzes cognitive distortions, mirrors key themes, and probes one step deeper.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#101626] border border-[#1e293b] hover:border-purple-500/40 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-base text-white mb-1.5">
              Hands-Free Dictation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time voice stream speech-to-text. Dump thoughts while walking, building PCs, or cooling down after a gaming session.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#101626] border border-[#1e293b] hover:border-amber-500/40 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-base text-white mb-1.5">
              Telemetry &amp; Quests
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time mood telemetry, identified emotion tags, photo memories, and automated weekly syntheses celebrating personal wins.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#1e293b] py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CHIPMIND &mdash; AI CODEX v2.0</span>
          <span className="text-cyan-400/80">AUTHENTICATED USER: {allowedEmail}</span>
        </div>
      </footer>
    </div>
  );
};
