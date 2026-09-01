'use client';

import React, { useState } from 'react';
import { Lecture } from '@/types/lecture';
import {
  FileText,
  Sparkles,
  Download,
  Share2,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  ArrowLeft,
  Check,
  Copy,
  Layers,
  FileDown
} from 'lucide-react';
import { TranscriptViewer } from './TranscriptViewer';
import { StudyNotesTab } from './StudyNotesTab';
import { AudioPlayer } from './AudioPlayer';
import { exportLectureToPdf, exportLectureToText } from '@/lib/pdf-export';

interface LectureViewProps {
  lecture: Lecture;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdateFlashcardMastery?: (flashcardId: string, mastered: boolean) => void;
  apiKey?: string;
}

export function LectureView({
  lecture,
  onBack,
  onDelete,
  onUpdateFlashcardMastery,
  apiKey,
}: LectureViewProps) {
  const [activeMainTab, setActiveMainTab] = useState<'study' | 'transcript'>('study');
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);
  const [copiedText, setCopiedText] = useState(false);

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
  };

  const handleCopyFormatted = () => {
    const text = exportLectureToText(lecture);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = exportLectureToText(lecture);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(lecture.subject || 'Aula').replace(/\s+/g, '_')}_Notas.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateStr = new Date(lecture.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 space-y-6 pb-28">
      {/* Botão de Retornar / Nova Aula */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Envio de Gravações</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Exportar PDF */}
          <button
            onClick={() => exportLectureToPdf(lecture)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            title="Baixar PDF de Estudos"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>

          {/* Copiar para WhatsApp/Notion */}
          <button
            onClick={handleCopyFormatted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Copiar texto completo"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedText ? 'Copiado!' : 'Copiar Notas'}</span>
          </button>

          {/* Baixar Markdown */}
          <button
            onClick={handleDownloadTxt}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
            title="Baixar Markdown (.md)"
          >
            <FileDown className="w-3.5 h-3.5" />
          </button>

          {/* Excluir */}
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir esta aula?')) {
                onDelete(lecture.id);
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            title="Excluir aula"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cartão de Cabeçalho da Aula */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 sm:p-7 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {lecture.subject || 'Disciplina Geral'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {dateStr}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
          {lecture.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span>
            <strong>{lecture.segments?.length || 0}</strong> trechos transcritos
          </span>
          <span>•</span>
          <span>
            <strong>{lecture.flashcards?.length || 0}</strong> flashcards gerados
          </span>
          <span>•</span>
          <span>
            <strong>{lecture.quiz?.length || 0}</strong> questões simuladas
          </span>
        </div>
      </div>

      {/* Seletor de Abas Principais (Modo Estudo vs Transcrição) */}
      <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300/60 dark:border-slate-700">
        <button
          onClick={() => setActiveMainTab('study')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
            activeMainTab === 'study'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Modo Estudo & Resumos</span>
        </button>

        <button
          onClick={() => setActiveMainTab('transcript')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
            activeMainTab === 'transcript'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Transcrição Completa (Timestamps)</span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeMainTab === 'study' ? (
        <StudyNotesTab
          lecture={lecture}
          onUpdateFlashcardMastery={onUpdateFlashcardMastery}
          apiKey={apiKey}
        />
      ) : (
        <TranscriptViewer
          segments={lecture.segments || []}
          onSeek={handleSeek}
        />
      )}

      {/* Player de Áudio Sincronizado Fixo no Rodapé */}
      {(lecture.audioBlob || lecture.audioUrl) && (
        <AudioPlayer
          audioBlob={lecture.audioBlob}
          audioUrl={lecture.audioUrl}
          seekTime={seekTime}
        />
      )}
    </div>
  );
}
