'use client';

import React, { useState, useMemo } from 'react';
import { TranscriptSegment } from '@/types/lecture';
import { Search, Copy, Check, Play, User, UserCheck, HelpCircle, Type } from 'lucide-react';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  onSeek: (seconds: number) => void;
}

export function TranscriptViewer({ segments, onSeek }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(
      (s) => s.text.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q)
    );
  }, [segments, searchQuery]);

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    return 0;
  };

  const handleCopySegment = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = segments.map((s) => `[${s.time}] ${s.speaker}: ${s.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/40 text-slate-900 dark:text-white px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const fontClass = fontSize === 'sm' ? 'text-xs leading-relaxed' : fontSize === 'lg' ? 'text-base leading-loose' : 'text-sm leading-relaxed';

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas: Busca, Tamanho de Fonte e Cópia */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar termo na aula (ex: conceito, prova, artigo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
              {filteredSegments.length} resultados
            </span>
          )}
        </div>

        {/* Ajuste de Fonte & Copiar Tudo */}
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${fontSize === 'sm' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-500'}`}
              title="Fonte menor"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${fontSize === 'base' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-500'}`}
              title="Fonte padrão"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${fontSize === 'lg' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-500'}`}
              title="Fonte ampliada"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Copiado!' : 'Copiar Tudo'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Segmentos de Transcrição */}
      <div className="space-y-3">
        {filteredSegments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm">Nenhum trecho encontrado com "{searchQuery}".</p>
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const isProfessor = segment.speaker.toLowerCase().includes('prof');
            const isStudent = segment.speaker.toLowerCase().includes('alun') || segment.speaker.toLowerCase().includes('estudante');
            const seconds = segment.seconds || parseTimeToSeconds(segment.time);

            return (
              <div
                key={segment.id || index}
                className="group p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-800/80 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Botão de Pular para o Áudio */}
                    <button
                      onClick={() => onSeek(seconds)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800/60 active:scale-95 transition-all"
                      title="Ouvir a partir deste momento"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {segment.time}
                    </button>

                    {/* Tag de Interlocutor */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isProfessor
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50'
                          : isStudent
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isProfessor ? <UserCheck className="w-3 h-3" /> : isStudent ? <HelpCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {segment.speaker || 'Professor'}
                    </span>
                  </div>

                  {/* Botão de Copiar Segmento */}
                  <button
                    onClick={() => handleCopySegment(segment.text, segment.id || String(index))}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-80 hover:opacity-100 transition-all"
                    title="Copiar este trecho"
                  >
                    {copiedId === (segment.id || String(index)) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Texto da Fala */}
                <p className={`text-slate-800 dark:text-slate-200 font-normal ${fontClass}`}>
                  {highlightMatch(segment.text, searchQuery)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
