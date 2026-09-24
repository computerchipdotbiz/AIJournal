'use client';

import React from 'react';
import { BookOpen, Sparkles, TrendingUp, Settings, Plus, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'journal' | 'insights' | 'new';
  setActiveTab: (tab: 'journal' | 'insights' | 'new') => void;
  onOpenSettings: () => void;
  onLockApp?: () => void;
  passcodeEnabled?: boolean;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onLockApp,
  passcodeEnabled,
  entryCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#fcfbf9]/80 border-b border-[#ebe7df]">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('journal')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5b7065] to-[#7d9d8c] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <span className="font-serif font-semibold text-lg tracking-tight text-[#1f2421]">
              Rosebud
            </span>
            <span className="text-xs text-[#64748b] ml-1.5 font-sans font-medium hidden sm:inline-block">
              Self-Reflection
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'journal'
                ? 'bg-[#e8edea] text-[#2c4035]'
                : 'text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Journal</span>
            {entryCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#5b7065]/15 text-[#2c4035]">
                {entryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-[#e8edea] text-[#2c4035]'
                : 'text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Insights</span>
          </button>
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {activeTab !== 'new' && (
            <button
              onClick={() => setActiveTab('new')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-sm font-medium shadow-sm transition-all hover:shadow active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Reflect</span>
            </button>
          )}

          {passcodeEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock Journal"
              className="p-2 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
