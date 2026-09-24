'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Compass,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { JournalEntry, WeeklyInsight } from '@/lib/types';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  apiKey: string;
  onSaveInsight: (insight: WeeklyInsight) => Promise<void>;
  existingInsights: WeeklyInsight[];
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  entries,
  apiKey,
  onSaveInsight,
  existingInsights,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<WeeklyInsight | null>(
    existingInsights[0] || null
  );

  if (!isOpen) return null;

  const handleGenerateReview = async () => {
    if (entries.length === 0) {
      setError('You need at least 1 journal entry to generate a weekly review.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.slice(0, 15),
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate review');
      }

      const data = await response.json();
      const newInsight: WeeklyInsight = {
        id: `weekly-${Date.now()}`,
        weekStartDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        weekEndDate: new Date().toISOString(),
        title: data.title || 'Weekly Growth Synthesis',
        summary: data.summary || '',
        topThemes: data.topThemes || [],
        growthAreas: data.growthAreas || [],
        wins: data.wins || [],
        keyMindsetShift: data.keyMindsetShift || '',
        recommendedFocus: data.recommendedFocus || '',
        createdAt: new Date().toISOString(),
      };

      await onSaveInsight(newInsight);
      setActiveInsight(newInsight);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating review';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl border border-[#ebe7df] shadow-xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ebe7df] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-serif text-[#1f2421]">
                Weekly AI Review & Patterns
              </h2>
              <p className="text-xs text-[#64748b]">
                Rosebud pattern recognition across your recent writing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#94a3b8] hover:text-[#1f2421] rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!activeInsight ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f2eb] text-[#5b7065] mx-auto flex items-center justify-center mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1f2421] mb-1">
                Synthesize Your Week
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-6">
                The AI will review your past entries, identify emotional patterns, celebrate breakthroughs, and suggest an empowering focus for the week ahead.
              </p>
              <button
                onClick={handleGenerateReview}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full font-medium text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing your reflections...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Weekly Review</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Insight Title & Date */}
              <div>
                <div className="flex items-center gap-2 text-xs text-[#64748b] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5b7065]" />
                  <span>Past 7 Days Reflection</span>
                </div>
                <h3 className="text-xl font-serif font-semibold text-[#1f2421]">
                  {activeInsight.title}
                </h3>
              </div>

              {/* Summary narrative */}
              <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#ebe7df] text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                {activeInsight.summary}
              </div>

              {/* Breakthrough Wins */}
              {activeInsight.wins && activeInsight.wins.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider mb-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>Celebrated Wins & Progress</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeInsight.wins.map((win, idx) => (
                      <li key={idx} className="text-xs text-amber-950 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Mindset Shift */}
              {activeInsight.keyMindsetShift && (
                <div className="p-4 rounded-2xl bg-[#e8edea]/70 border border-[#5b7065]/20">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#2c4035] mb-1">
                    Key Mindset Shift
                  </div>
                  <p className="text-xs sm:text-sm text-[#2c4035] italic">
                    &ldquo;{activeInsight.keyMindsetShift}&rdquo;
                  </p>
                </div>
              )}

              {/* Top Themes & Growth Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeInsight.topThemes?.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#ebe7df]">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Top Themes
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeInsight.topThemes.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-[#f5f2eb] text-[#1f2421]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeInsight.growthAreas?.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#ebe7df]">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Patterns To Watch
                    </div>
                    <div className="space-y-1">
                      {activeInsight.growthAreas.map((g, idx) => (
                        <div key={idx} className="text-xs text-[#475569] leading-tight">
                          • {g}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Focus for Next Week */}
              {activeInsight.recommendedFocus && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
                    <span>Recommended Focus For Next Week</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-950 font-medium">
                    {activeInsight.recommendedFocus}
                  </p>
                </div>
              )}

              {/* Refresh / Re-analyze button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateReview}
                  disabled={isGenerating}
                  className="text-xs text-[#5b7065] hover:text-[#485b51] font-medium flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Re-generate with latest entries</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
