'use client';

import React from 'react';
import { Flame, Sparkles, TrendingUp, Heart } from 'lucide-react';
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
      const y = chartHeight - padding - ((sortedEntries[0].moodScore - 1) / 9) * (chartHeight - padding * 2);
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
        <div className="bg-white p-4 rounded-3xl border border-[#ebe7df] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-semibold text-[#1f2421]">
              {calculateStreak()} {calculateStreak() === 1 ? 'day' : 'days'}
            </div>
            <div className="text-xs text-[#64748b]">Reflection Streak</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#ebe7df] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-semibold text-[#1f2421]">
              {avgMood} <span className="text-xs text-[#94a3b8]">/ 10</span>
            </div>
            <div className="text-xs text-[#64748b]">Average Mood</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#ebe7df] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-semibold text-[#1f2421]">
              {entries.length}
            </div>
            <div className="text-xs text-[#64748b]">Total Reflections</div>
          </div>
        </div>
      </div>

      {/* Mood Trend Timeline Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#ebe7df]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1f2421]">
            <TrendingUp className="w-4 h-4 text-[#5b7065]" />
            <span>Mood Trend Over Time</span>
          </div>
          <span className="text-xs text-[#64748b]">Recent entries</span>
        </div>

        {sortedEntries.length > 1 ? (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32 overflow-visible"
            >
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b7065" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5b7065" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal guideline */}
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="#f1f0ea"
                strokeDasharray="4 4"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#5b7065"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
                    fill="#ffffff"
                    stroke="#5b7065"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-[11px] text-[#94a3b8] px-2 pt-2 border-t border-[#f5f2eb]">
              <span>Earlier</span>
              <span>Latest</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#94a3b8] py-8 text-center">
            Write 2 or more journal reflections to generate your visual mood trend line.
          </p>
        )}
      </div>

      {/* Top Recurring Feelings */}
      {topEmotions.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-[#ebe7df]">
          <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Frequent Emotional States
          </h3>
          <div className="flex flex-wrap gap-2">
            {topEmotions.map(([emotion, count]) => (
              <span
                key={emotion}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#f5f2eb] text-[#2c4035] flex items-center gap-1.5"
              >
                <span className="capitalize">{emotion}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#5b7065]/15 font-semibold">
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
