'use client';

import React from 'react';
import { Sparkles, BookOpen, Settings, HelpCircle, History, PlusCircle, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onNewLecture: () => void;
  historyCount: number;
  hasActiveLecture: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Navbar({
  onOpenHistory,
  onOpenSettings,
  onOpenGuide,
  onNewLecture,
  historyCount,
  hasActiveLecture,
  theme,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo e Título */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNewLecture}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                AulaScribe
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                3.7 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
              Assistente & Transcrição Universitária
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasActiveLecture && (
            <button
              onClick={onNewLecture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-200 dark:border-blue-800/60 active:scale-95"
              title="Nova Transcrição"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Aula</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-slate-200 dark:border-slate-700/60"
            title="Minhas Aulas Gravadas"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Histórico</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGuide}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Como usar no iPhone"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Configurações & Chave Gemini"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
