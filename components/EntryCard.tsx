'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Smile,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry } from '@/lib/types';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (score >= 6) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 4) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-3xl border border-[#ebe7df] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <Calendar className="w-3.5 h-3.5 text-[#5b7065]" />
          <span>{formattedDate}</span>
          {entry.promptUsed && (
            <>
              <span>•</span>
              <span className="font-medium text-[#1f2421]">{entry.promptUsed}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mood Badge */}
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getMoodColor(
              entry.moodScore
            )}`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>{entry.moodScore}/10</span>
          </span>

          {/* Delete Button */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this journal entry?')) {
                onDelete(entry.id);
              }
            }}
            title="Delete entry"
            className="p-1.5 text-[#94a3b8] hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-serif font-semibold text-[#1f2421] mb-2 leading-snug">
        {entry.title}
      </h2>

      {/* AI Summary Highlight */}
      {entry.summary && (
        <div className="p-3 rounded-2xl bg-[#fcfbf9] border border-[#ebe7df]/70 mb-3 text-xs sm:text-sm text-[#334155] leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#5b7065] shrink-0 mt-0.5" />
          <div>{entry.summary}</div>
        </div>
      )}

      {/* User Journal Content */}
      {entry.content && (
        <div className="text-xs sm:text-sm text-[#1f2421] leading-relaxed whitespace-pre-wrap mb-3 p-3.5 rounded-2xl bg-[#fcfbf9]/60 border border-[#ebe7df]/60">
          {entry.content}
        </div>
      )}

      {/* Action Items if any */}
      {entry.actionItems && entry.actionItems.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {entry.actionItems.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Emotions & Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {entry.emotions.map((emo, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8edea] text-[#2c4035]"
          >
            {emo}
          </span>
        ))}
        {entry.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f2eb] text-[#64748b]"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Expandable Conversation Transcript */}
      {entry.conversation && entry.conversation.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#f5f2eb]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-[#5b7065] hover:text-[#485b51] transition-colors"
          >
            <span>{isExpanded ? 'Hide reflection details' : 'View full reflection'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-[#5b7065]/30 animate-fadeIn">
              {entry.conversation.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-[#1f2421]">
                    {msg.sender === 'user' ? 'You: ' : 'Mirror: '}
                  </span>
                  <span className="text-[#475569]">{msg.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
