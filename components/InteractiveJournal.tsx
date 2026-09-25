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
          className="mb-4 p-5 rounded-3xl bg-gradient-to-r from-[#e8edea] to-[#f5f2eb] border border-[#5b7065]/30 hover:border-[#5b7065] cursor-pointer transition-all shadow-xs hover:shadow-sm group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white text-[#5b7065] shadow-xs group-hover:scale-105 transition-transform">
              <Feather className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-[#1f2421] text-base group-hover:text-[#5b7065] transition-colors">
                  Open Journal / Free Write
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#5b7065] text-white">
                  Fastest
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Type or dictate your thoughts freely. Save anytime with 1 click.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#5b7065] hidden sm:inline-block">
            Start writing &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {JOURNAL_PROMPTS.filter((p) => p.id !== 'freeform').map((prompt) => {
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
                className="flex items-start gap-3.5 p-4 rounded-3xl bg-white border border-[#ebe7df] hover:border-[#5b7065]/40 hover:shadow-xs text-left transition-all group"
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
            <span>Ready to Save</span>
          </div>

          <input
            type="text"
            value={synthesizedResult.title}
            onChange={(e) =>
              setSynthesizedResult({ ...synthesizedResult, title: e.target.value })
            }
            placeholder="Entry Title"
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
              <span className="text-sm font-semibold text-[#2c4035] px-2.5 py-0.5 rounded-full bg-white border border-[#ebe7df]">
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebe7df]">
            <button
              onClick={() => setSynthesizedResult(null)}
              className="px-4 py-2 text-sm text-[#64748b] hover:text-[#1f2421] font-medium"
            >
              Back to writing
            </button>
            <button
              onClick={handleFinalSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full font-semibold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to Journal'}</span>
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
        <div className="mb-3 p-2.5 rounded-2xl bg-[#e8edea] border border-[#5b7065]/30 text-[#2c4035] text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-[#5b7065]" />
            Restored unfinished thoughts from your previous session
          </span>
          <button
            onClick={() => setDraftRestoredBanner(false)}
            className="p-1 text-[#5b7065] hover:text-[#1f2421]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebe7df] mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackNavigation}
            className="p-1.5 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[#1f2421]">
              {selectedPrompt.title}
            </h2>
            <p className="text-[11px] text-[#64748b]">
              Reflect with AI mirror or save anytime
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick 1-Click Save */}
          <button
            onClick={handleDirectSave}
            disabled={isSaving || !hasUserWritten}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
            title="Save directly to your journal"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
          </button>

          {/* AI Synthesis Wrap-Up */}
          {hasUserWritten && (
            <button
              onClick={handleSynthesizeAndWrapUp}
              disabled={isSynthesizing || isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f2eb] hover:bg-[#ebe7df] text-[#2c4035] rounded-full text-xs font-medium border border-[#ebe7df] transition-all disabled:opacity-50 hidden sm:inline-flex"
              title="Get AI tags and summary"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-3 mb-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            {apiError}
          </span>
          <button
            onClick={onOpenSettings}
            className="font-semibold underline ml-2 hover:text-amber-950 shrink-0"
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
          {/* Photo Preview Strip */}
          {photos.length > 0 && (
            <div className="flex items-center gap-2 px-2 pt-1 pb-2 overflow-x-auto border-b border-[#f5f2eb] mb-1.5">
              {photos.map((photoUrl, idx) => (
                <div key={idx} className="relative shrink-0 group">
                  <img
                    src={photoUrl}
                    alt={`Photo ${idx + 1}`}
                    className="w-14 h-14 object-cover rounded-2xl border border-[#ebe7df] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1f2421]/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] transition-colors shadow-xs"
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
                  className="w-14 h-14 rounded-2xl border-2 border-dashed border-[#ebe7df] hover:border-[#5b7065] text-[#94a3b8] hover:text-[#5b7065] flex flex-col items-center justify-center text-[10px] transition-colors shrink-0"
                  title="Add more photos"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px]">Add</span>
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
            placeholder="Write your thoughts here... (Enter to reflect with AI, Shift+Enter for new line)"
            className="w-full px-3 py-1.5 text-sm bg-transparent resize-none focus:outline-none text-[#1f2421] placeholder:text-[#94a3b8]"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-100/60">
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
                className="p-1.5 text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb] rounded-full transition-colors relative"
                title="Add photo from your day"
              >
                <Camera className="w-4 h-4 text-[#5b7065]" />
                {photos.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#5b7065] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {photos.length}
                  </span>
                )}
              </button>

              {/* Emoji Palette Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                  className={`p-1.5 rounded-full transition-colors ${
                    isEmojiOpen
                      ? 'bg-[#e8edea] text-[#2c4035]'
                      : 'text-[#64748b] hover:text-[#1f2421] hover:bg-[#f5f2eb]'
                  }`}
                  title="Add emoji nuance"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                </button>

                <EmojiPicker
                  isOpen={isEmojiOpen}
                  onClose={() => setIsEmojiOpen(false)}
                  onSelectEmoji={handleInsertEmoji}
                />
              </div>

              <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
                Voice &amp; Nuance
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Direct Save & Finish button in toolbar */}
              <button
                type="button"
                onClick={handleDirectSave}
                disabled={isSaving || !hasUserWritten}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8edea] hover:bg-[#d8e3dc] text-[#2c4035] rounded-full text-xs font-semibold transition-all disabled:opacity-40 shadow-2xs"
                title="Save this entry to your journal immediately"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5b7065]" />
                <span>{isSaving ? 'Saving...' : 'Save & Finish'}</span>
              </button>

              {/* Send / Reflect Button */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isStreaming}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#5b7065] hover:bg-[#485b51] disabled:opacity-40 text-white rounded-full text-xs font-medium transition-all shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#ebe7df] shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1f2421]">
                Save your reflection?
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                You have thoughts written in this session. Would you like to save them to your journal before leaving?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  handleDirectSave();
                }}
                className="w-full py-2.5 bg-[#5b7065] hover:bg-[#485b51] text-white rounded-full text-xs font-semibold transition-all"
              >
                Save to Journal
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  // keep draft in localStorage so they can resume later
                  onCancel();
                }}
                className="w-full py-2 bg-[#f5f2eb] hover:bg-[#ebe7df] text-[#475569] rounded-full text-xs font-medium transition-all"
              >
                Save as Draft & Exit
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  clearStoredDraft();
                  onCancel();
                }}
                className="w-full py-2 text-[#94a3b8] hover:text-red-600 text-xs font-medium transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
