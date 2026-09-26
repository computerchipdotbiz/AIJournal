'use client';

import React from 'react';
import { Flame, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { JournalEntry } from '@/lib/types';

interface MoodChartProps {
  entries: JournalEntry[];
}

export const MoodChart: React.FC<MoodChartProps> = ({ entries }) => {
  // Sort oldest to newest for chronological chart
  const sortedEntries = [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // show last 14 entries max

  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 1;
    let prevDate = new Date(sorted[0].date);
    prevDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - prevDate.getTime()) / (1000 * 3600 * 24)
    );
    if (diffDays > 1) return 0; // streak broken if no entry yesterday or today

    for (let i = 1; i < sorted.length; i++) {
      const curDate = new Date(sorted[i].date);
      curDate.setHours(0, 0, 0, 0);
      const dayGap = Math.round(
        (prevDate.getTime() - curDate.getTime()) / (1000 * 3600 * 24)
      );
      if (dayGap === 1) {
        streak++;
        prevDate = curDate;
      } else if (dayGap === 0) {
        // same day entry, continue
      } else {
        break;
      }
    }
    return streak;
  };

  const avgMood =
    entries.length > 0
      ? (
          entries.reduce((acc, curr) => acc + (curr.moodScore || 5), 0) /
          entries.length
        ).toFixed(1)
      : '0.0';

  // Aggregate emotions count
  const emotionCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.emotions?.forEach((emo) => {
      const lower = emo.toLowerCase();
      emotionCounts[lower] = (emotionCounts[lower] || 0) + 1;
    });
  });
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // SVG Chart bounds
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 20;

  const getPoints = () => {
    if (sortedEntries.length === 0) return '';
    if (sortedEntries.length === 1) {
      const y =
        chartHeight -
        padding -
        ((sortedEntries[0].moodScore - 1) / 9) * (chartHeight - padding * 2);
      return `${padding},${y} ${chartWidth - padding},${y}`;
    }

    const step = (chartWidth - padding * 2) / (sortedEntries.length - 1);
    return sortedEntries
      .map((entry, idx) => {
        const x = padding + idx * step;
        const normalized = ((entry.moodScore || 5) - 1) / 9;
        const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#101626] p-4 rounded-3xl border border-[#1e293b] hover:border-amber-500/40 flex items-center gap-3.5 shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">
              {calculateStreak()} {calculateStreak() === 1 ? 'DAY' : 'DAYS'}
            </div>
            <div className="text-xs font-mono text-amber-400/80">QUEST STREAK</div>
          </div>
        </div>

        <div className="bg-[#101626] p-4 rounded-3xl border border-[#1e293b] hover:border-cyan-500/40 flex items-center gap-3.5 shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">
              {avgMood} <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="text-xs font-mono text-cyan-400/80">AVG TELEMETRY</div>
          </div>
        </div>

        <div className="bg-[#101626] p-4 rounded-3xl border border-[#1e293b] hover:border-purple-500/40 flex items-center gap-3.5 shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">
              {entries.length}
            </div>
            <div className="text-xs font-mono text-purple-400/80">TOTAL LOGS</div>
          </div>
        </div>
      </div>

      {/* Mood Trend Timeline Card */}
      <div className="bg-[#101626] p-5 sm:p-6 rounded-3xl border border-[#1e293b] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Emotional Waveform / Telemetry Graph</span>
          </div>
          <span className="text-xs font-mono text-cyan-400/80">[RECENT 14 SESSIONS]</span>
        </div>

        {sortedEntries.length > 1 ? (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32 overflow-visible"
            >
              <defs>
                <linearGradient id="cyberWaveGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <filter id="neonLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal guideline */}
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="#1e293b"
                strokeDasharray="4 4"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="url(#cyberWaveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonLineGlow)"
                points={getPoints()}
              />

              {/* Data points */}
              {sortedEntries.map((entry, idx) => {
                const step = (chartWidth - padding * 2) / (sortedEntries.length - 1);
                const x = padding + idx * step;
                const normalized = ((entry.moodScore || 5) - 1) / 9;
                const y =
                  chartHeight - padding - normalized * (chartHeight - padding * 2);
                return (
                  <circle
                    key={entry.id}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#00f0ff"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 px-2 pt-2 border-t border-[#1e293b]">
              <span>T-PAST</span>
              <span>T-PRESENT</span>
            </div>
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-500 py-8 text-center">
            Log 2 or more reflections to render your telemetry waveform.
          </p>
        )}
      </div>

      {/* Top Recurring Feelings */}
      {topEmotions.length > 0 && (
        <div className="bg-[#101626] p-5 rounded-3xl border border-[#1e293b] shadow-xl">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-3">
            Frequent Cognitive Nodes
          </h3>
          <div className="flex flex-wrap gap-2">
            {topEmotions.map(([emotion, count]) => (
              <span
                key={emotion}
                className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-2"
              >
                <span className="capitalize">{emotion}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/30">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
