'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Laugh, Sparkles, Heart, Zap, CloudRain, Sun, Smile } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const QUICK_FAVORITES = ['😂', '🤣', '💀', '😭', '😌', '✨', '🤍'];

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'laughter',
    name: 'Laughter & Humor',
    icon: <Laugh className="w-3.5 h-3.5 text-amber-400" />,
    emojis: [
      '😂', '🤣', '💀', '😭', '😆', '😅', '🤪', '😜', '😝', '🤭',
      '😹', '🤡', '🙃', '🫠', '🙈', '🥴', '😈', '🪦', '🍿', '🤦', '🤷'
    ],
  },
  {
    id: 'calm',
    name: 'Calm & Mana',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
    emojis: ['😌', '🧘', '🤍', '✨', '🌱', '🕊️', '🌿', '🌸', '☀️', '☕', '🕯️', '🌈', '🍃', '🌊'],
  },
  {
    id: 'joy',
    name: 'Joy & Buffs',
    icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
    emojis: ['😊', '😃', '🥰', '🥹', '🥳', '💖', '🫶', '🙌', '🎉', '🌟', '💛', '🌻', '🤩', '😻'],
  },
  {
    id: 'stress',
    name: 'Tension & Wipe',
    icon: <Zap className="w-3.5 h-3.5 text-rose-400" />,
    emojis: ['🤯', '🫠', '😬', '😣', '😫', '😤', '😮‍💨', '🌪️', '⚡', '🪫', '💥', '⏳', '😵‍💫', '🤦'],
  },
  {
    id: 'tender',
    name: 'Sad & Vulnerable',
    icon: <CloudRain className="w-3.5 h-3.5 text-purple-400" />,
    emojis: ['😔', '🥺', '😢', '😭', '💔', '🌧️', '🥀', '🩹', '🫂', '🕳️', '🍂', '😞', '😿', '🖤'],
  },
  {
    id: 'wonder',
    name: 'Thoughtful & Curious',
    icon: <Smile className="w-3.5 h-3.5 text-cyan-400" />,
    emojis: ['🤔', '🙃', '😶', '😶‍🌫️', '🙄', '🧐', '🤷', '💭', '❓', '⚖️', '🧭', '🎭', '🪄', '🔮'],
  },
  {
    id: 'energy',
    name: 'Action & Combat',
    icon: <Heart className="w-3.5 h-3.5 text-amber-500" />,
    emojis: ['🎯', '🚀', '💡', '🔥', '💪', '🏆', '✅', '📖', '🎧', '🏃', '💻', '🌅', '🍕', '⚔️'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('laughter');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-0 sm:left-auto right-0 sm:right-auto sm:w-80 bg-[#101626] border border-[#1e293b] rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white uppercase tracking-wider">
          <Smile className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nuance &amp; Emoji Palette</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#151e34] transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Quick Favorites Bar */}
      <div className="flex items-center justify-between px-2 py-1 mb-2 bg-[#090d16] rounded-xl border border-[#1e293b]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Fast:</span>
        <div className="flex items-center gap-1">
          {QUICK_FAVORITES.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[#151e34] rounded-lg transition-transform active:scale-125"
              title={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none font-mono">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
              activeCategory === cat.id
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'bg-[#090d16] text-slate-400 hover:text-white hover:bg-[#151e34] border border-[#1e293b]'
            }`}
          >
            {cat.icon}
            <span>{cat.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1">
        {currentCat.emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-[#090d16] active:scale-120 transition-all select-none"
            title={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Category Full Name footer */}
      <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="text-cyan-400">{currentCat.name}</span>
        <span className="text-[10px] text-slate-500">Tap to inject</span>
      </div>
    </div>
  );
};
