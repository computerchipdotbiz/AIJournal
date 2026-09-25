'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  Feather,
  Mic,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Script from 'next/script';

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
  const [manualEmail, setManualEmail] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services when script loads and client ID exists
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (googleClientId && win.google?.accounts?.id && googleBtnRef.current) {
      try {
        win.google.accounts.id.initialize({
          client_id: googleClientId,
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

        win.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });
      } catch (err) {
        console.error('Google Sign In Init Error:', err);
      }
    }
  }, [googleClientId, onLoginSuccess]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
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
    <div className="min-h-screen bg-[#fcfbf9] text-[#1f2421] flex flex-col font-sans selection:bg-[#5b7065]/20">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* Header */}
      <header className="w-full border-b border-[#ebe7df] bg-[#fcfbf9]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5b7065] to-[#7d9d8c] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-[#1f2421]">
              ChipMind
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f2eb] border border-[#ebe7df]">
              <Lock className="w-3.5 h-3.5 text-[#5b7065]" />
              <span className="hidden sm:inline">Private Instance</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8edea] text-[#2c4035] text-xs font-semibold uppercase tracking-wider mb-6 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-[#5b7065]" />
          <span>Private AI Self-Reflection Companion</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1f2421] tracking-tight max-w-2xl leading-tight sm:leading-tight mb-5 animate-fadeIn">
          A journal that listens, mirrors, and helps you untangle your mind.
        </h1>

        <p className="text-sm sm:text-base text-[#64748b] max-w-xl leading-relaxed mb-10 animate-fadeIn">
          ChipMind transforms passive diary entries into an active Socratic dialogue. Speak or write freely, reframe anxious narratives, and uncover emotional clarity.
        </p>

        {/* Auth / Sign In Box */}
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-[#ebe7df] shadow-sm mb-16 text-left animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-base text-[#1f2421]">
              Owner Access
            </h2>
            <span className="text-[11px] font-semibold text-[#5b7065] px-2 py-0.5 rounded-full bg-[#e8edea]">
              Restricted
            </span>
          </div>

          <p className="text-xs text-[#64748b] mb-5 leading-relaxed">
            This personal journal is locked down exclusively for{' '}
            <strong className="text-[#1f2421] font-mono">{allowedEmail}</strong>.
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
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
              {!showManualLogin ? (
                <button
                  type="button"
                  onClick={() => setShowManualLogin(true)}
                  className="w-full py-3 px-4 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-2xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Owner ({allowedEmail})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <form onSubmit={handleManualLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                      Confirm Your Authorized Email
                    </label>
                    <input
                      type="email"
                      autoFocus
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="everythingfunny@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#ebe7df] focus:border-[#5b7065] focus:outline-none focus:ring-2 focus:ring-[#5b7065]/20 text-xs font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !manualEmail.trim()}
                      className="flex-1 py-2.5 bg-[#5b7065] hover:bg-[#485b51] disabled:opacity-50 text-white rounded-2xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying whitelist...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Authenticate & Enter</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualLogin(false)}
                      className="px-3 py-2 text-xs text-[#64748b] hover:text-[#1f2421]"
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
          <div className="p-6 rounded-3xl bg-white border border-[#ebe7df] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#1f2421] mb-1.5">
              Socratic Dialogue
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Instead of a blank canvas, write whatever is in your head. The AI provides empathetic validation and asks one gentle probing question at a time to help you go deeper.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#ebe7df] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#1f2421] mb-1.5">
              Hands-Free Dictation
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Tap the microphone to speak your mind effortlessly. Perfect for evening debriefs in bed or morning walk reflections on your phone.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#ebe7df] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base text-[#1f2421] mb-1.5">
              Patterns & Syntheses
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Visual mood trend tracking, identified emotion tags, and automated weekly synthesis reports highlighting celebrated wins and recurring cognitive patterns.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#ebe7df] py-6 text-center text-xs text-[#94a3b8]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ChipMind &mdash; Private AI Self-Reflection</span>
          <span>Only for {allowedEmail}</span>
        </div>
      </footer>
    </div>
  );
};
