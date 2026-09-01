'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AudioUploader } from '@/components/AudioUploader';
import { LectureView } from '@/components/LectureView';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { SettingsModal } from '@/components/SettingsModal';
import { IOSGuideModal } from '@/components/IOSGuideModal';
import { Lecture, TranscriptionResponse } from '@/types/lecture';
import { getAllLectures, saveLecture, deleteLecture, updateFlashcardMastery, db } from '@/lib/db';

const DEFAULT_GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const DEFAULT_GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function Home() {
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [groqKey, setGroqKey] = useState(DEFAULT_GROQ_KEY);
  const [geminiKey, setGeminiKey] = useState(DEFAULT_GEMINI_KEY);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Carrega preferências do usuário e histórico do IndexedDB
  useEffect(() => {
    setIsMounted(true);
    const savedGroqKey = localStorage.getItem('aulascribe_groq_key') || DEFAULT_GROQ_KEY;
    const savedGeminiKey = localStorage.getItem('aulascribe_gemini_key') || DEFAULT_GEMINI_KEY;
    const savedTheme = (localStorage.getItem('aulascribe_theme') as 'dark' | 'light') || 'light';
    
    setGroqKey(savedGroqKey);
    setGeminiKey(savedGeminiKey);
    setTheme(savedTheme);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Carrega histórico
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await getAllLectures();
      setLectures(stored);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('aulascribe_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveGroqKey = (key: string) => {
    setGroqKey(key);
    localStorage.setItem('aulascribe_groq_key', key);
  };

  const handleSaveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem('aulascribe_gemini_key', key);
  };

  const handleTranscriptionSuccess = async (
    data: TranscriptionResponse,
    audioBlob: Blob | undefined,
    durationSeconds: number
  ) => {
    const newLecture: Lecture = {
      id: `lec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: data.title || 'Aula Universitária',
      subject: data.subject || 'Geral',
      createdAt: Date.now(),
      durationSeconds: durationSeconds || 0,
      audioBlob: audioBlob,
      rawTranscription: data.segments?.map((s) => `[${s.time}] ${s.speaker}: ${s.text}`).join('\n\n') || '',
      segments: data.segments?.map((s, idx) => ({
        id: `seg_${idx}`,
        time: s.time || '00:00',
        seconds: 0,
        speaker: s.speaker || 'Professor',
        text: s.text || '',
      })) || [],
      summary: data.summary || 'Resumo não disponível.',
      keyTopics: data.keyTopics || [],
      examAlerts: data.examAlerts || [],
      flashcards: data.flashcards?.map((f, idx) => ({
        id: `fc_${idx}`,
        question: f.question,
        answer: f.answer,
        mastered: false,
      })) || [],
      quiz: data.quiz?.map((q, idx) => ({
        id: `quiz_${idx}`,
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex ?? 0,
        explanation: q.explanation || '',
      })) || [],
      glossary: data.glossary || [],
    };

    try {
      await saveLecture(newLecture);
      await loadHistory();
      setActiveLecture(newLecture);
    } catch (err) {
      console.error('Erro ao salvar aula no histórico:', err);
      setActiveLecture(newLecture);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    try {
      await deleteLecture(id);
      if (activeLecture?.id === id) {
        setActiveLecture(null);
      }
      await loadHistory();
    } catch (err) {
      console.error('Erro ao deletar aula:', err);
    }
  };

  const handleUpdateMastery = async (flashcardId: string, mastered: boolean) => {
    if (!activeLecture) return;
    try {
      await updateFlashcardMastery(activeLecture.id, flashcardId, mastered);
      setActiveLecture((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          flashcards: prev.flashcards.map((f) =>
            f.id === flashcardId ? { ...f, mastered } : f
          ),
        };
      });
      await loadHistory();
    } catch (err) {
      console.error('Erro ao atualizar flashcard:', err);
    }
  };

  const handleClearAllData = async () => {
    try {
      await db.lectures.clear();
      setLectures([]);
      setActiveLecture(null);
    } catch (err) {
      console.error('Erro ao limpar banco:', err);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Barra de Navegação */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onNewLecture={() => setActiveLecture(null)}
        historyCount={lectures.length}
        hasActiveLecture={!!activeLecture}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1">
        {activeLecture ? (
          <LectureView
            lecture={activeLecture}
            onBack={() => setActiveLecture(null)}
            onDelete={handleDeleteLecture}
            onUpdateFlashcardMastery={handleUpdateMastery}
            apiKey={geminiKey}
          />
        ) : (
          <div className="py-6 sm:py-10">
            <AudioUploader
              onTranscriptionSuccess={handleTranscriptionSuccess}
              groqKey={groqKey}
              geminiKey={geminiKey}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Drawer de Histórico */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lectures={lectures}
        onSelectLecture={(lec) => setActiveLecture(lec)}
        onDeleteLecture={handleDeleteLecture}
        activeLectureId={activeLecture?.id}
      />

      {/* Modal de Configurações */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        groqKey={groqKey}
        onSaveGroqKey={handleSaveGroqKey}
        geminiKey={geminiKey}
        onSaveGeminiKey={handleSaveGeminiKey}
        onClearAllData={handleClearAllData}
      />

      {/* Modal de Guia para iPhone */}
      <IOSGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
