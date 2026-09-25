'use client';

import React from 'react';
import { BookOpen, Sparkles, TrendingUp, Settings, Plus, Lock, LogOut } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#fcfbf9]/90 border-b border-[#ebe7df]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('journal')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#5b7065] to-[#7d9d8c] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
          </div>
          <div>
            <span className="font-serif font-semibold text-base sm:text-lg tracking-tight text-[#1f2421]">
              ChipMind
            </span>
            <span className="text-xs text-[#64748b] ml-1.5 font-sans font-medium hidden md:inline-block">
              Self-Reflection
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'journal'
                ? 'bg-[#e8edea] text-[#2c4035]'
                : 'text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Journal</span>
            {entryCount > 0 && (
              <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full bg-[#5b7065]/15 text-[#2c4035] font-semibold">
                {entryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-[#e8edea] text-[#2c4035]'
                : 'text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Insights</span>
          </button>
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {activeTab !== 'new' && (
            <button
              onClick={() => setActiveTab('new')}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all hover:shadow active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Reflect</span>
            </button>
          )}

          {passcodeEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock Journal"
              className="p-1.5 sm:p-2 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-1.5 sm:p-2 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title={`Sign Out (${userEmail || 'everythingfunny@gmail.com'})`}
              className="p-1.5 sm:p-2 text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
