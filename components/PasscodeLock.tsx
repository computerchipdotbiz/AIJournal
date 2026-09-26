'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { ChipMindLogo } from './ChipMindLogo';

interface PasscodeLockProps {
  correctHash?: string;
  onUnlock: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({
  correctHash,
  onUnlock,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    if (passcode === correctHash) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#101626] p-8 rounded-2xl border border-[#1e293b] shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <ChipMindLogo size={56} className="filter drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
        </div>

        <h2 className="text-lg font-semibold font-mono text-white mb-1 uppercase tracking-wide flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Security Lockdown</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Enter authentication PIN to access telemetry codex
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••"
              className={`w-full px-4 py-3 text-center tracking-widest text-lg rounded-xl border bg-[#090d16] font-mono text-white ${
                error
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-[#1e293b] focus:border-cyan-500 focus:ring-cyan-500/20'
              } focus:outline-none focus:ring-2 transition-all`}
            />
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-mono">
              [ACCESS DENIED] Invalid passcode.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <span>Decrypt Codex</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
