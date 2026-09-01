'use client';

import React, { useState } from 'react';
import { Lecture } from '@/types/lecture';
import { 
  ListTree, 
  Copy, 
  Check, 
  Download, 
  Search, 
  BookOpen, 
  Clock, 
  Sparkles,
  ChevronRight,
  Share2
} from 'lucide-react';

interface BulletSummaryTabProps {
  lecture: Lecture;
}

export function BulletSummaryTab({ lecture }: BulletSummaryTabProps) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Se a aula ainda não tiver bulletSummary (aulas antigas), faz um fallback inteligente com keyTopics e summary
  const getRawContent = () => {
    if (lecture.bulletSummary && lecture.bulletSummary.trim()) {
      return lecture.bulletSummary;
    }
    // Fallback estruturado
    let text = `### 1. [00:00] Síntese e Visão Geral da Aula\n- ${lecture.summary.replace(/\n\n/g, '\n- ')}\n\n`;
    if (lecture.keyTopics && lecture.keyTopics.length > 0) {
      text += `### 2. Principais Conceitos Desenvolvidos pelo Professor\n`;
      lecture.keyTopics.forEach((t, i) => {
        text += `- **${t.title}**: ${t.explanation}\n`;
      });
    }
    if (lecture.examAlerts && lecture.examAlerts.length > 0) {
      text += `\n### 3. Pontos Críticos e Alertas de Prova\n`;
      lecture.examAlerts.forEach((alert) => {
        text += `- ⚠️ ${alert}\n`;
      });
    }
    return text;
  };

  const content = getRawContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumo_Completo_${lecture.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Separa o conteúdo em blocos por títulos "### "
  const blocks = content.split(/(?=### )/g).filter((b) => b.trim().length > 0);

  const filteredBlocks = blocks.filter((b) => 
    !searchQuery || b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barra Superior com Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Resumo Completo (Estrutura da Aula)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organizado em tópicos e bullet points seguindo a ordem cronológica da fala do professor.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no resumo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Copiar */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shrink-0"
            title="Copiar texto completo"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Baixar Markdown */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all active:scale-95 border border-blue-200 dark:border-blue-800/60 shrink-0"
            title="Baixar em Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar .MD</span>
          </button>
        </div>
      </div>

      {/* Lista de Blocos Cronológicos */}
      <div className="space-y-4">
        {filteredBlocks.map((block, bIdx) => {
          const lines = block.trim().split('\n');
          const titleLine = lines[0].replace(/^###\s*/, '');
          const bulletLines = lines.slice(1).filter((l) => l.trim().length > 0);

          // Extrai timestamp se houver (ex: [12:30])
          const timeMatch = titleLine.match(/\[(\d{2}:\d{2})\]/);
          const time = timeMatch ? timeMatch[1] : null;
          const cleanTitle = titleLine.replace(/\[\d{2}:\d{2}\]/, '').trim();

          return (
            <div
              key={bIdx}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-800/60 space-y-3.5"
            >
              {/* Título do Tópico */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {bIdx + 1}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {cleanTitle}
                  </h3>
                </div>

                {time && (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {time}
                  </span>
                )}
              </div>

              {/* Lista de Bullet Points */}
              <ul className="space-y-2.5 pt-1">
                {bulletLines.map((line, lIdx) => {
                  const cleanLine = line.replace(/^-\s*/, '').replace(/^\*\s*/, '');
                  const isWarning = cleanLine.includes('⚠️') || cleanLine.toLowerCase().includes('prova') || cleanLine.toLowerCase().includes('atenção');

                  return (
                    <li
                      key={lIdx}
                      className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${
                        isWarning
                          ? 'p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isWarning ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div 
                        className="flex-1"
                        dangerouslySetInnerHTML={{
                          __html: cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>')
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {filteredBlocks.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            Nenhum tópico encontrado para a busca &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
