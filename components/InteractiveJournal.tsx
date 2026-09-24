'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
  Feather,
  Compass,
  BookOpen
} from 'lucide-react';
import { JournalMessage, JournalEntry, JournalPrompt } from '@/lib/types';
import { JOURNAL_PROMPTS } from '@/lib/prompts';
import { VoiceRecorder } from './VoiceRecorder';

interface InteractiveJournalProps {
  apiKey: string;
  reflectionStyle: string;
  onSaveEntry: (entry: JournalEntry) => Promise<void>;
  onCancel: () => void;
  onOpenSettings: () => void;
}

export const InteractiveJournal: React.FC<InteractiveJournalProps> = ({
  apiKey,
  reflectionStyle,
  onSaveEntry,
  onCancel,
  onOpenSettings,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Post-synthesis confirmation stage
  const [synthesizedResult, setSynthesizedResult] = useState<{
    title: string;
    summary: string;
    moodScore: number;
    emotions: string[];
    tags: string[];
    actionItems: string[];
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll as messages or tokens arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSelectPrompt = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setMessages([
      {
        id: 'msg-initial',
        sender: 'assistant',
        content: prompt.initialGreeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;
    setApiError(null);

    const userMessage: JournalMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          apiKey: apiKey || undefined,
          style: reflectionStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.needsKey) {
          setApiError('Gemini API key is required. Click Settings to add your free key from Google AI Studio.');
        } else {
          setApiError(errorData.error || 'Failed to get reflection response');
        }
        setIsStreaming(false);
        return;
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';
      const assistantId = `assistant-${Date.now()}`;

      // Insert empty assistant placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sender: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantReply += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: assistantReply } : msg
          )
        );
      }
    } catch (err: unknown) {
      console.error('Error reflecting:', err);
      setApiError('Network error connecting to reflection service.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSynthesizeAndWrapUp = async () => {
    if (messages.length < 2) return;
    setIsSynthesizing(true);
    setApiError(null);

    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: messages,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize entry');
      }

      const data = await response.json();
      setSynthesizedResult({
        title: data.title || 'Daily Reflection',
        summary: data.summary || '',
        moodScore: data.moodScore || 6,
        emotions: data.emotions || ['reflective'],
        tags: data.tags || ['daily'],
        actionItems: data.actionItems || [],
      });

      // Confetti celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#5b7065', '#e09f3e', '#7d9d8c'],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error summarizing entry';
      setApiError(message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleFinalSave = async () => {
    if (!synthesizedResult) return;

    // Concatenate all user writings
    const fullContent = messages
      .filter((m) => m.sender === 'user')
      .map((m) => m.content)
      .join('\n\n');

    const entry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: synthesizedResult.title,
      date: new Date().toISOString(),
      content: fullContent,
      summary: synthesizedResult.summary,
      moodScore: synthesizedResult.moodScore,
      emotions: synthesizedResult.emotions,
      tags: synthesizedResult.tags,
      actionItems: synthesizedResult.actionItems,
      conversation: messages,
      promptUsed: selectedPrompt?.title || 'Open Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveEntry(entry);
  };

  // 1. Initial Prompt Selection Screen
  if (!selectedPrompt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onCancel}
            className="p-2 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-semibold text-[#1f2421]">
              How would you like to reflect?
            </h1>
            <p className="text-sm text-[#64748b]">
              Choose a prompt framework or write freely
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {JOURNAL_PROMPTS.map((prompt) => {
            const getIcon = () => {
              switch (prompt.icon) {
                case 'Sun':
                  return <Sun className="w-5 h-5 text-amber-500" />;
                case 'Moon':
                  return <Moon className="w-5 h-5 text-indigo-400" />;
                case 'Feather':
                  return <Feather className="w-5 h-5 text-emerald-500" />;
                case 'Compass':
                  return <Compass className="w-5 h-5 text-rose-500" />;
                case 'BookOpen':
                  return <BookOpen className="w-5 h-5 text-cyan-500" />;
                default:
                  return <Sparkles className="w-5 h-5 text-[#5b7065]" />;
              }
            };

            return (
              <button
                key={prompt.id}
                onClick={() => handleSelectPrompt(prompt)}
                className="flex items-start gap-3.5 p-4 rounded-3xl bg-white border border-[#ebe7df] hover:border-[#5b7065]/40 hover:shadow-sm text-left transition-all group"
              >
                <div className="p-2.5 rounded-2xl bg-[#f5f2eb] group-hover:scale-105 transition-transform">
                  {getIcon()}
                </div>
                <div>
                  <h3 className="font-medium text-[#1f2421] text-sm group-hover:text-[#5b7065] transition-colors">
                    {prompt.title}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                    {prompt.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Synthesized Review & Confirmation Screen
  if (synthesizedResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ebe7df] shadow-sm">
          <div className="flex items-center gap-2 text-[#5b7065] mb-2 font-medium text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Entry Synthesized</span>
          </div>

          <input
            type="text"
            value={synthesizedResult.title}
            onChange={(e) =>
              setSynthesizedResult({ ...synthesizedResult, title: e.target.value })
            }
            className="w-full text-2xl font-serif font-semibold text-[#1f2421] border-b border-transparent hover:border-[#ebe7df] focus:border-[#5b7065] focus:outline-none py-1 mb-4"
          />

          <div className="mb-5">
            <label className="text-xs font-semibold text-[#64748b] block uppercase tracking-wider mb-1.5">
              Summary
            </label>
            <textarea
              rows={2}
              value={synthesizedResult.summary}
              onChange={(e) =>
                setSynthesizedResult({ ...synthesizedResult, summary: e.target.value })
              }
              className="w-full text-sm text-[#334155] p-3 rounded-2xl bg-[#fcfbf9] border border-[#ebe7df] focus:outline-none focus:ring-2 focus:ring-[#5b7065]/20"
            />
          </div>

          {/* Mood Slider */}
          <div className="mb-5 p-4 rounded-2xl bg-[#f5f2eb]/60 border border-[#ebe7df]/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Mood Score
              </span>
              <span className="text-sm font-semibold text-[#2c4035] px-2 py-0.5 rounded-full bg-white border border-[#ebe7df]">
                {synthesizedResult.moodScore} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={synthesizedResult.moodScore}
              onChange={(e) =>
                setSynthesizedResult({
                  ...synthesizedResult,
                  moodScore: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-[#5b7065] cursor-pointer"
            />
          </div>

          {/* Emotions & Tags */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#64748b] block uppercase tracking-wider mb-2">
              Identified Emotions & Themes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {synthesizedResult.emotions.map((emo, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8edea] text-[#2c4035]"
                >
                  {emo}
                </span>
              ))}
              {synthesizedResult.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f2eb] text-[#64748b]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Commitments */}
          {synthesizedResult.actionItems.length > 0 && (
            <div className="mb-6">
              <label className="text-xs font-semibold text-[#64748b] block uppercase tracking-wider mb-2">
                Actionable Takeaways
              </label>
              <ul className="space-y-1.5">
                {synthesizedResult.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-[#334155] flex items-center gap-2 p-2 rounded-xl bg-[#fcfbf9] border border-[#ebe7df]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b7065]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#ebe7df]">
            <button
              onClick={() => setSynthesizedResult(null)}
              className="px-4 py-2 text-sm text-[#64748b] hover:text-[#1f2421] font-medium"
            >
              Back to writing
            </button>
            <button
              onClick={handleFinalSave}
              className="px-5 py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full font-medium text-sm shadow-sm transition-all"
            >
              Save to Journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Conversational Writing Flow
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebe7df] mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPrompt(null)}
            className="p-1.5 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[#1f2421]">
              {selectedPrompt.title}
            </h2>
            <p className="text-[11px] text-[#64748b]">
              Interactive reflection partner
            </p>
          </div>
        </div>

        {messages.length >= 2 && (
          <button
            onClick={handleSynthesizeAndWrapUp}
            disabled={isSynthesizing || isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Wrap Up Entry</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-3 mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>{apiError}</span>
          <button
            onClick={onOpenSettings}
            className="font-semibold underline ml-2 hover:text-amber-950 shrink-0"
          >
            Open Settings
          </button>
        </div>
      )}

      {/* Message Chat List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-xs transition-all ${
                  isUser
                    ? 'bg-[#5b7065] text-white rounded-br-xs'
                    : 'bg-white border border-[#ebe7df] text-[#1f2421] rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-xs text-[#5b7065] font-medium mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reflection Mirror</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[#64748b] italic pl-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5b7065]" />
            <span>Reflecting on your words...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="mt-3 pt-2 border-t border-[#ebe7df]">
        <div className="relative bg-white border border-[#ebe7df] focus-within:border-[#5b7065] focus-within:ring-3 focus-within:ring-[#5b7065]/15 rounded-3xl p-2 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Write your thoughts here... (Enter to reflect, Shift+Enter for new line)"
            className="w-full px-3 py-1 text-sm bg-transparent resize-none focus:outline-none text-[#1f2421] placeholder:text-[#94a3b8]"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-100/60">
            <div className="flex items-center gap-1">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                disabled={isStreaming}
              />
              <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
                Tap mic to speak
              </span>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isStreaming}
              className="p-2 bg-[#5b7065] hover:bg-[#485b51] disabled:opacity-40 text-white rounded-full transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
