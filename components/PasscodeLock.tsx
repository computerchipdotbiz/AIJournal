'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';

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

    // Simple hash comparison (or direct comparison if stored)
    if (passcode === correctHash) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-[#ebe7df] shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#e8edea] flex items-center justify-center text-[#2c4035]">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-serif font-semibold text-[#1f2421] mb-1">
          Private Journal
        </h2>
        <p className="text-xs text-[#64748b] mb-6">
          Enter your secret passcode to unlock your thoughts
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
              placeholder="Enter passcode..."
              className={`w-full px-4 py-3 text-center tracking-widest text-lg rounded-2xl border ${
                error
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-[#ebe7df] focus:border-[#5b7065] focus:ring-[#5b7065]/20'
              } focus:outline-none focus:ring-4 transition-all`}
            />
            <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">
              Incorrect passcode. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-2xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Unlock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
