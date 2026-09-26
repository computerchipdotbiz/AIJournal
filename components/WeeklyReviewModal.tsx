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
  AlertCircle,
  Cpu,
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
      setError('You need at least 1 journal entry to generate a weekly telemetry review.');
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
        title: data.title || 'Weekly Cognitive Synthesis',
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101626] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#1e293b] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wide">
                Weekly AI Telemetry &amp; Pattern Analysis
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                ChipMind neural pattern recognition across recent entries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151e34] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#101626]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!activeInsight ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-xl bg-[#090d16] border border-[#1e293b] text-cyan-400 mx-auto flex items-center justify-center mb-3 shadow-md">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1 font-mono">
                Synthesize Weekly Telemetry
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                The neural core will process your recent entries, identify behavioral loops, celebrate quest milestones, and calibrate an optimal focus for the upcoming week.
              </p>
              <button
                onClick={handleGenerateReview}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold font-mono text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyzing cognitive nodes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compute Weekly Synthesis</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Insight Title & Date */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>7-Day Diagnostic Window</span>
                </div>
                <h3 className="text-lg font-semibold text-white font-mono">
                  {activeInsight.title}
                </h3>
              </div>

              {/* Summary narrative */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {activeInsight.summary}
              </div>

              {/* Breakthrough Wins - WoW Legendary Amber Tier */}
              {activeInsight.wins && activeInsight.wins.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 shadow-sm shadow-amber-950/30">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold font-mono text-xs uppercase tracking-wider mb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Legendary Breakthroughs &amp; Trophies</span>
                  </div>
                  <ul className="space-y-1.5 font-sans">
                    {activeInsight.wins.map((win, idx) => (
                      <li key={idx} className="text-xs text-amber-100 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Mindset Shift - WoW Epic Nether Purple Tier */}
              {activeInsight.keyMindsetShift && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 shadow-sm shadow-purple-950/30">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300 mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Epic Mindset Calibration</span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-100 italic font-mono">
                    &ldquo;{activeInsight.keyMindsetShift}&rdquo;
                  </p>
                </div>
              )}

              {/* Top Themes & Growth Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeInsight.topThemes?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1e293b]">
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Telemetry Nodes
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeInsight.topThemes.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeInsight.growthAreas?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1e293b]">
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Patterns To Watch
                    </div>
                    <div className="space-y-1">
                      {activeInsight.growthAreas.map((g, idx) => (
                        <div key={idx} className="text-xs text-slate-300 leading-tight">
                          • {g}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Focus for Next Week - Arcane Mana Cyan Tier */}
              {activeInsight.recommendedFocus && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 shadow-sm shadow-cyan-950/30">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300 mb-1 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Primary Quest Objective For Next Week</span>
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-100 font-medium">
                    {activeInsight.recommendedFocus}
                  </p>
                </div>
              )}

              {/* Refresh / Re-analyze button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateReview}
                  disabled={isGenerating}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Re-compute telemetry with latest data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
