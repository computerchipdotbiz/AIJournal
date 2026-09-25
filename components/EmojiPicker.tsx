'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Heart, Zap, CloudRain, Sun, Smile } from 'lucide-react';

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

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'calm',
    name: 'Calm & Gratitude',
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
    emojis: ['😌', '🧘', '🤍', '✨', '🌱', '🕊️', '🌿', '🌸', '☀️', '☕', '🕯️', '🌈', '🍃', '🌊'],
  },
  {
    id: 'joy',
    name: 'Joy & Warmth',
    icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    emojis: ['😊', '😃', '🥰', '🥹', '🥳', '💖', '🫶', '🙌', '🎉', '🌟', '💛', '🌻', '🤩', '😻'],
  },
  {
    id: 'stress',
    name: 'Tension & Overwhelm',
    icon: <Zap className="w-3.5 h-3.5 text-rose-500" />,
    emojis: ['🤯', '🫠', '😬', '😣', '😫', '😤', '😮‍💨', '🌪️', '⚡', '🪫', '💥', '⏳', '😵‍💫', '🤦'],
  },
  {
    id: 'tender',
    name: 'Sad & Vulnerable',
    icon: <CloudRain className="w-3.5 h-3.5 text-indigo-400" />,
    emojis: ['😔', '🥺', '😢', '😭', '💔', '🌧️', '🥀', '🩹', '🫂', '🕳️', '🍂', '😞', '😿', '🖤'],
  },
  {
    id: 'wonder',
    name: 'Thoughtful & Curious',
    icon: <Smile className="w-3.5 h-3.5 text-cyan-500" />,
    emojis: ['🤔', '🙃', '😶', '😶‍🌫️', '🙄', '🧐', '🤷', '💭', '❓', '⚖️', '🧭', '🎭', '🪄', '🔮'],
  },
  {
    id: 'energy',
    name: 'Action & Life',
    icon: <Heart className="w-3.5 h-3.5 text-amber-600" />,
    emojis: ['🎯', '🚀', '💡', '🔥', '💪', '🏆', '✅', '📖', '🎧', '🏃', '💻', '🌅', '🍕', '🏡'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('calm');
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
      className="absolute bottom-full mb-2 left-0 sm:left-auto right-0 sm:right-auto sm:w-80 bg-white border border-[#ebe7df] rounded-3xl shadow-xl p-3 z-50 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f5f2eb]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1f2421]">
          <span>Emotional Nuance Palette</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#94a3b8] hover:text-[#1f2421] rounded-full hover:bg-[#f5f2eb] transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 ${
              activeCategory === cat.id
                ? 'bg-[#5b7065] text-white shadow-2xs'
                : 'bg-[#f5f2eb] text-[#64748b] hover:text-[#1f2421] hover:bg-[#ebe7df]'
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
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-[#f5f2eb] active:scale-120 transition-all select-none"
            title={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Category Full Name footer */}
      <div className="mt-2 pt-2 border-t border-[#f5f2eb] flex items-center justify-between text-[11px] text-[#64748b]">
        <span>{currentCat.name}</span>
        <span className="text-[10px] text-[#94a3b8]">Tap to insert</span>
      </div>
    </div>
  );
};
