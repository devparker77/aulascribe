'use client';

import React, { useState, useMemo } from 'react';
import { Lecture } from '@/types/lecture';
import {
  X,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Trash2,
  Download,
  FileText,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { exportLectureToPdf } from '@/lib/pdf-export';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lectures: Lecture[];
  onSelectLecture: (lecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  activeLectureId?: string;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  lectures,
  onSelectLecture,
  onDeleteLecture,
  activeLectureId,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extrai lista única de matérias
  const subjects = useMemo(() => {
    const set = new Set<string>();
    lectures.forEach((l) => l.subject && set.add(l.subject));
    return Array.from(set);
  }, [lectures]);

  // Filtra as aulas
  const filteredLectures = useMemo(() => {
    return lectures.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.summary?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || l.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [lectures, searchTerm, selectedSubject]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho do Drawer */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Minhas Aulas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lectures.length} {lectures.length === 1 ? 'aula salva no aparelho' : 'aulas salvas no aparelho'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nas aulas gravadas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Chips de Matéria */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedSubject === sub
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Aulas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLectures.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhuma aula encontrada.</p>
              <p className="text-xs mt-1">Transcreva uma gravação para salvá-la aqui.</p>
            </div>
          ) : (
            filteredLectures.map((lecture) => {
              const isActive = lecture.id === activeLectureId;
              const dateStr = new Date(lecture.createdAt).toLocaleDateString('pt-BR');

              return (
                <div
                  key={lecture.id}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  onClick={() => {
                    onSelectLecture(lecture);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {lecture.subject || 'Geral'}
                    </span>

                    <div className="flex items-center gap-1 opacity-90">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportLectureToPdf(lecture);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        title="Baixar PDF de Estudos"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deseja excluir esta aula gravada?')) {
                            onDeleteLecture(lecture.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-all"
                        title="Excluir Aula"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {lecture.title}
                  </h4>

                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                    {lecture.durationSeconds ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(lecture.durationSeconds)}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {lecture.flashcards?.length || 0} cards
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
