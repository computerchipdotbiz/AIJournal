'use client';

import React from 'react';
import { BookOpen, TrendingUp, Settings, Plus, Lock, LogOut } from 'lucide-react';
import { ChipMindLogo } from './ChipMindLogo';

interface NavbarProps {
  activeTab: 'journal' | 'insights' | 'new';
  setActiveTab: (tab: 'journal' | 'insights' | 'new') => void;
  onOpenSettings: () => void;
  onLockApp?: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
  passcodeEnabled?: boolean;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onLockApp,
  onLogout,
  userEmail,
  passcodeEnabled,
  entryCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#090d16]/90 border-b border-[#1e293b]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab('journal')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <ChipMindLogo size={36} glow={true} className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                CHIPMIND
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 tracking-widest hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CORE ONLINE</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'journal'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Journal</span>
            {entryCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {entryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Telemetry</span>
          </button>
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {activeTab !== 'new' && (
            <button
              onClick={() => setActiveTab('new')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full text-xs sm:text-sm shadow-[0_0_14px_rgba(6,182,212,0.35)] transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Reflect</span>
            </button>
          )}

          {passcodeEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock Journal"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded-full transition-colors border border-transparent hover:border-slate-700"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded-full transition-colors border border-transparent hover:border-slate-700"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title={`Sign Out (${userEmail || 'everythingfunny@gmail.com'})`}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-full transition-colors border border-transparent hover:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
