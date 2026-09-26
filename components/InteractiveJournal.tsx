'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  BookOpen,
  BookmarkCheck,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Plus,
  Smile,
  X
} from 'lucide-react';
import { JournalMessage, JournalEntry, JournalPrompt } from '@/lib/types';
import { JOURNAL_PROMPTS } from '@/lib/prompts';
import { VoiceRecorder } from './VoiceRecorder';
import { getStoredDraft, saveStoredDraft, clearStoredDraft } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';
import { EmojiPicker } from './EmojiPicker';

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [draftRestoredBanner, setDraftRestoredBanner] = useState(false);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft if one exists on mount
  useEffect(() => {
    const draft = getStoredDraft();
    if (draft && (draft.messages.length > 0 || draft.inputText.trim() || (draft.photos && draft.photos.length > 0))) {
      if (draft.promptId) {
        const found = JOURNAL_PROMPTS.find((p) => p.id === draft.promptId);
        if (found) setSelectedPrompt(found);
      } else {
        setSelectedPrompt(JOURNAL_PROMPTS.find((p) => p.id === 'freeform') || JOURNAL_PROMPTS[0]);
      }
      setMessages(draft.messages || []);
      setInputText(draft.inputText || '');
      if (draft.photos) setPhotos(draft.photos);
      setDraftRestoredBanner(true);
    }
  }, []);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (!selectedPrompt) return;
    const hasData = messages.length > 0 || inputText.trim().length > 0 || photos.length > 0;
    if (hasData) {
      saveStoredDraft({
        promptId: selectedPrompt.id,
        promptTitle: selectedPrompt.title,
        messages,
        inputText,
        photos,
      });
    }
  }, [selectedPrompt, messages, inputText, photos]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, 1200, 0.75);
        compressedList.push(compressed);
      }
      setPhotos((prev) => [...prev, ...compressedList].slice(0, 6)); // max 6 photos per entry
    } catch (err) {
      console.error('Error compressing photo:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

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

      if (!assistantReply.trim()) {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
        setApiError('Reflection mirror was momentarily quiet. You can try sending again or save your entry.');
      }
    } catch (err: unknown) {
      console.error('Error reflecting:', err);
      setApiError('Network or reflection service error. Your writing is safely saved.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleInsertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart ?? inputText.length;
      const end = textareaRef.current.selectionEnd ?? inputText.length;
      const nextText = inputText.substring(0, start) + emoji + inputText.substring(end);
      setInputText(nextText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
        }
      }, 10);
    } else {
      setInputText((prev) => prev + emoji);
    }
  };

  // Direct save without requiring AI synthesis
  const handleDirectSave = useCallback(async () => {
    if (isSaving) return;

    let currentMessages = [...messages];
    if (inputText.trim()) {
      const pendingMsg: JournalMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: inputText.trim(),
        timestamp: new Date().toISOString(),
      };
      currentMessages.push(pendingMsg);
      setMessages(currentMessages);
      setInputText('');
    }

    const userWritings = currentMessages
      .filter((m) => m.sender === 'user')
      .map((m) => m.content.trim())
      .filter(Boolean);

    if (userWritings.length === 0) {
      alert('Please write your thoughts before saving to your journal.');
      return;
    }

    setIsSaving(true);
    const fullContent = userWritings.join('\n\n');
    const firstLine = userWritings[0].split(/[.!?\n]/)[0]?.trim() || '';
    const words = firstLine.split(/\s+/).slice(0, 6).join(' ');
    const autoTitle = words ? `${words}...` : `${selectedPrompt?.title || 'Daily'} Reflection`;
    const autoSummary = userWritings[0].length > 160 ? `${userWritings[0].slice(0, 157)}...` : userWritings[0];

    const entry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: autoTitle,
      date: new Date().toISOString(),
      content: fullContent,
      summary: autoSummary,
      moodScore: 7,
      emotions: ['reflective', 'intentional'],
      tags: [selectedPrompt?.category || 'daily', 'reflection'],
      actionItems: [],
      conversation: currentMessages,
      photos: photos.length > 0 ? photos : undefined,
      promptUsed: selectedPrompt?.title || 'Open Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#5b7065', '#e09f3e', '#7d9d8c'],
    });

    clearStoredDraft();
    await onSaveEntry(entry);
    setIsSaving(false);
  }, [isSaving, messages, inputText, selectedPrompt, onSaveEntry]);

  // AI-Assisted Synthesis & Review Flow
  const handleSynthesizeAndWrapUp = async () => {
    let currentMessages = [...messages];
    if (inputText.trim()) {
      const pendingMsg: JournalMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: inputText.trim(),
        timestamp: new Date().toISOString(),
      };
      currentMessages.push(pendingMsg);
      setMessages(currentMessages);
      setInputText('');
    }

    const userWritings = currentMessages.filter((m) => m.sender === 'user');
    if (userWritings.length === 0) {
      alert('Please write a thought before summarizing.');
      return;
    }

    setIsSynthesizing(true);
    setApiError(null);

    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: currentMessages,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await response.json();
      setSynthesizedResult({
        title: data.title || 'Daily Reflection',
        summary: data.summary || userWritings[0].content.slice(0, 150),
        moodScore: data.moodScore || 7,
        emotions: data.emotions || ['reflective'],
        tags: data.tags || ['daily'],
        actionItems: data.actionItems || [],
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#5b7065', '#e09f3e', '#7d9d8c'],
      });
    } catch (err: unknown) {
      console.warn('Synthesis error, falling back to instant review:', err);
      // Fallback result so saving is NEVER blocked
      const userText = userWritings.map((m) => m.content).join(' ');
      setSynthesizedResult({
        title: `${selectedPrompt?.title || 'Daily'} Reflection`,
        summary: userText.length > 150 ? `${userText.slice(0, 147)}...` : userText,
        moodScore: 7,
        emotions: ['reflective'],
        tags: ['reflection'],
        actionItems: [],
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleFinalSave = async () => {
    if (!synthesizedResult || isSaving) return;
    setIsSaving(true);

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
      photos: photos.length > 0 ? photos : undefined,
      promptUsed: selectedPrompt?.title || 'Open Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    clearStoredDraft();
    await onSaveEntry(entry);
    setIsSaving(false);
  };

  const handleBackNavigation = () => {
    const hasContent =
      inputText.trim().length > 0 ||
      messages.some((m) => m.sender === 'user') ||
      photos.length > 0;
    if (hasContent) {
      setShowExitConfirm(true);
    } else {
      clearStoredDraft();
      onCancel();
    }
  };

  const hasUserWritten =
    inputText.trim().length > 0 ||
    messages.some((m) => m.sender === 'user') ||
    photos.length > 0;

  // 1. Initial Prompt Selection Screen
  if (!selectedPrompt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
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

        {/* Quick Freeform Card */}
        <div
          onClick={() =>
            handleSelectPrompt(
              JOURNAL_PROMPTS.find((p) => p.id === 'freeform') || JOURNAL_PROMPTS[0]
            )
          }
          className="mb-4 p-5 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#101626] to-purple-950/60 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#090d16] border border-cyan-500/30 text-cyan-400 shadow-md group-hover:scale-105 transition-transform">
              <Feather className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                  Open Terminal / Free Write
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                  INSTANT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Type or dictate your thoughts freely. Save anytime with 1 click.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 hidden sm:inline-block group-hover:translate-x-1 transition-transform">
            INITIALIZE &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {JOURNAL_PROMPTS.filter((p) => p.id !== 'freeform').map((prompt) => {
            const getIcon = () => {
              switch (prompt.icon) {
                case 'Sun':
                  return <Sun className="w-5 h-5 text-amber-400" />;
                case 'Moon':
                  return <Moon className="w-5 h-5 text-indigo-400" />;
                case 'Feather':
                  return <Feather className="w-5 h-5 text-emerald-400" />;
                case 'Compass':
                  return <Compass className="w-5 h-5 text-rose-400" />;
                case 'BookOpen':
                  return <BookOpen className="w-5 h-5 text-cyan-400" />;
                default:
                  return <Sparkles className="w-5 h-5 text-cyan-400" />;
              }
            };

            return (
              <button
                key={prompt.id}
                onClick={() => handleSelectPrompt(prompt)}
                className="flex items-start gap-3.5 p-4 rounded-3xl bg-[#101626] border border-[#1e293b] hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] text-left transition-all group"
              >
                <div className="p-2.5 rounded-2xl bg-[#090d16] border border-[#1e293b] group-hover:scale-105 transition-transform">
                  {getIcon()}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                    {prompt.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
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
        <div className="bg-[#101626] p-6 sm:p-8 rounded-3xl border border-[#1e293b] shadow-2xl">
          <div className="flex items-center gap-2 text-cyan-400 mb-2 font-mono text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Telemetry Compiled // Ready to Commit</span>
          </div>

          <input
            type="text"
            value={synthesizedResult.title}
            onChange={(e) =>
              setSynthesizedResult({ ...synthesizedResult, title: e.target.value })
            }
            placeholder="Entry Title"
            className="w-full text-2xl font-sans font-bold text-white border-b border-transparent hover:border-[#1e293b] focus:border-cyan-500 focus:outline-none py-1 mb-4 bg-transparent"
          />

          <div className="mb-5">
            <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider mb-1.5">
              Synthesis Summary
            </label>
            <textarea
              rows={2}
              value={synthesizedResult.summary}
              onChange={(e) =>
                setSynthesizedResult({ ...synthesizedResult, summary: e.target.value })
              }
              className="w-full text-sm text-slate-200 p-3 rounded-2xl bg-[#090d16] border border-[#1e293b] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Mood Slider */}
          <div className="mb-5 p-4 rounded-2xl bg-[#0d1322] border border-[#1e293b]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Telemetry Score
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40">
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
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Emotions & Tags */}
          <div className="mb-5">
            <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider mb-2">
              Cognitive Nodes &amp; Leylines
            </label>
            <div className="flex flex-wrap gap-1.5">
              {synthesizedResult.emotions.map((emo, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                >
                  {emo}
                </span>
              ))}
              {synthesizedResult.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/60 text-purple-300 border border-purple-500/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Commitments */}
          {synthesizedResult.actionItems.length > 0 && (
            <div className="mb-6">
              <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider mb-2">
                Quest Objectives / Action Items
              </label>
              <ul className="space-y-1.5">
                {synthesizedResult.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-200 flex items-center gap-2 p-2 rounded-xl bg-[#090d16] border border-[#1e293b]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              onClick={() => setSynthesizedResult(null)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium"
            >
              Back to writing
            </button>
            <button
              onClick={handleFinalSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'Committing...' : 'Commit to Codex'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Conversational Writing Flow
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex flex-col h-[calc(100dvh-4.25rem)] sm:h-[calc(100vh-5rem)]">
      {/* Draft Restored Banner */}
      {draftRestoredBanner && (
        <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-1.5 font-mono">
            <BookmarkCheck className="w-4 h-4 text-cyan-400" />
            Restored active telemetry draft from previous session
          </span>
          <button
            onClick={() => setDraftRestoredBanner(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackNavigation}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#101626] rounded-xl border border-transparent hover:border-[#1e293b] transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{selectedPrompt.title}</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                ACTIVE
              </span>
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Reflect with AI mirror or commit anytime
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick 1-Click Save */}
          <button
            onClick={handleDirectSave}
            disabled={isSaving || !hasUserWritten}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40"
            title="Commit directly to your journal"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSaving ? 'Committing...' : 'Commit'}</span>
          </button>

          {/* AI Synthesis Wrap-Up */}
          {hasUserWritten && (
            <button
              onClick={handleSynthesizeAndWrapUp}
              disabled={isSynthesizing || isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101626] hover:bg-[#151e34] text-cyan-300 rounded-xl text-xs font-mono font-medium border border-cyan-500/30 transition-all disabled:opacity-50 hidden sm:inline-flex shadow-xs"
              title="Get AI tags and summary"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-3 mb-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {apiError}
          </span>
          <button
            onClick={onOpenSettings}
            className="font-semibold underline ml-2 hover:text-white shrink-0"
          >
            Settings
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
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 text-cyan-50 rounded-br-xs shadow-md shadow-cyan-950/40'
                    : 'bg-[#101626] border border-[#1e293b] text-slate-200 rounded-bl-xs shadow-md'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-medium mb-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Neural Mirror</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 pl-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Analyzing cognitive telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="mt-3 pt-2 border-t border-[#1e293b]">
        <div className="relative bg-[#101626]/90 border border-[#1e293b] focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-2xl p-2 transition-all shadow-lg">
          {/* Photo Preview Strip */}
          {photos.length > 0 && (
            <div className="flex items-center gap-2 px-2 pt-1 pb-2 overflow-x-auto border-b border-[#1e293b] mb-1.5">
              {photos.map((photoUrl, idx) => (
                <div key={idx} className="relative shrink-0 group">
                  <img
                    src={photoUrl}
                    alt={`Telemetry frame ${idx + 1}`}
                    className="w-14 h-14 object-cover rounded-xl border border-cyan-500/30 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-950/90 border border-rose-500/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] transition-colors shadow-xs"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-[#1e293b] hover:border-cyan-500/60 text-slate-500 hover:text-cyan-400 flex flex-col items-center justify-center text-[10px] transition-colors shrink-0 font-mono"
                  title="Attach memory image"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px]">Attach</span>
                </button>
              )}
            </div>
          )}

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
            placeholder="Type your reflection... (Enter to query AI mirror, Shift+Enter for new line)"
            className="w-full px-3 py-1.5 text-sm bg-transparent resize-none focus:outline-none text-slate-100 placeholder:text-slate-500 font-sans"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#1e293b]/60">
            <div className="flex items-center gap-1">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                disabled={isStreaming}
              />

              {/* Photo Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || photos.length >= 6}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#090d16] rounded-xl transition-colors relative"
                title="Attach memory snapshot"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                {photos.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {photos.length}
                  </span>
                )}
              </button>

              {/* Emoji Palette Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isEmojiOpen
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-[#090d16]'
                  }`}
                  title="Add emoji nuance"
                >
                  <Smile className="w-4 h-4 text-amber-400" />
                </button>

                <EmojiPicker
                  isOpen={isEmojiOpen}
                  onClose={() => setIsEmojiOpen(false)}
                  onSelectEmoji={handleInsertEmoji}
                />
              </div>

              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline ml-1">
                [AUDIO &amp; VISUAL INPUT]
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Direct Save & Finish button in toolbar */}
              <button
                type="button"
                onClick={handleDirectSave}
                disabled={isSaving || !hasUserWritten}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-semibold transition-all disabled:opacity-40 shadow-xs"
                title="Commit this entry to your database"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isSaving ? 'Committing...' : 'Commit & Exit'}</span>
              </button>

              {/* Send / Reflect Button */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isStreaming}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                title="Reflect with AI"
              >
                <span>Reflect</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal when Leaving with Unsaved Text */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#101626] rounded-2xl max-w-sm w-full p-6 border border-[#1e293b] shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">
                Commit active reflection?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You have uncommitted thoughts in this session buffer. Would you like to save them to your codex before leaving?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  handleDirectSave();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                Commit to Codex
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  // keep draft in localStorage so they can resume later
                  onCancel();
                }}
                className="w-full py-2 bg-[#090d16] hover:bg-[#151e34] text-slate-300 rounded-xl text-xs font-mono border border-[#1e293b] transition-all"
              >
                Save Cache &amp; Exit
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  clearStoredDraft();
                  onCancel();
                }}
                className="w-full py-2 text-slate-500 hover:text-rose-400 text-xs font-mono transition-all"
              >
                Discard Buffer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
