'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Smile,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  Flame,
} from 'lucide-react';
import { JournalEntry } from '@/lib/types';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // WoW item rarity tier styling based on mood score
  const getMoodColor = (score: number) => {
    if (score >= 8) {
      // Legendary Amber / Gold
      return 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    }
    if (score >= 6) {
      // Epic Purple / Nether
      return 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]';
    }
    if (score >= 4) {
      // Rare Arcane / Cyan
      return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]';
    }
    // Shadow / Fire Rose
    return 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
  };

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-[#101626] rounded-3xl border border-[#1e293b] p-5 sm:p-6 shadow-lg hover:border-cyan-500/40 hover:shadow-[0_0_24px_rgba(6,182,212,0.12)] transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formattedDate}</span>
          {entry.promptUsed && (
            <>
              <span className="text-slate-600">•</span>
              <span className="font-sans font-semibold text-slate-300">{entry.promptUsed}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mood / Rarity Badge */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getMoodColor(
              entry.moodScore
            )}`}
          >
            {entry.moodScore >= 8 ? (
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Smile className="w-3.5 h-3.5" />
            )}
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
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-full hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-sans font-bold text-white mb-2 leading-snug tracking-tight">
        {entry.title}
      </h2>

      {/* AI Summary Highlight */}
      {entry.summary && (
        <div className="p-3 rounded-2xl bg-[#090d16] border border-cyan-500/25 mb-3 text-xs sm:text-sm text-cyan-100/90 leading-relaxed flex items-start gap-2.5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>{entry.summary}</div>
        </div>
      )}

      {/* User Journal Content */}
      {entry.content && (
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-3 p-3.5 rounded-2xl bg-[#0d1322] border border-[#1e293b]">
          {entry.content}
        </div>
      )}

      {/* Attached Photos Gallery */}
      {entry.photos && entry.photos.length > 0 && (
        <div
          className={`mb-3.5 gap-2 grid ${
            entry.photos.length === 1
              ? 'grid-cols-1'
              : entry.photos.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {entry.photos.map((photoUrl, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxPhoto(photoUrl)}
              className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#090d16] aspect-4/3 cursor-pointer group shadow-md hover:border-cyan-500/50 transition-all"
            >
              <img
                src={photoUrl}
                alt={`Journal photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Action Commitments / Quest Objectives */}
      {entry.actionItems && entry.actionItems.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {entry.actionItems.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 font-mono"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
          >
            {emo}
          </span>
        ))}
        {entry.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Expandable Conversation Transcript */}
      {entry.conversation && entry.conversation.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e293b]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>{isExpanded ? 'Collapse Neural Transcript' : 'Expand Neural Transcript'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-cyan-500/40 animate-fadeIn">
              {entry.conversation.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className={`font-mono font-bold ${msg.sender === 'user' ? 'text-cyan-300' : 'text-purple-300'}`}>
                    {msg.sender === 'user' ? '[USER]: ' : '[CHIPMIND]: '}
                  </span>
                  <span className="text-slate-300">{msg.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto}
              alt="Full resolution journal photo"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-cyan-500/40"
            />
          </div>
        </div>
      )}
    </article>
  );
};
