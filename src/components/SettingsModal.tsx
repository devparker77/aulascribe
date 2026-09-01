'use client';

import React, { useState } from 'react';
import { X, Key, Sparkles, ExternalLink, Check, Trash2, ShieldCheck, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groqKey: string;
  onSaveGroqKey: (key: string) => void;
  geminiKey: string;
  onSaveGeminiKey: (key: string) => void;
  onClearAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  groqKey,
  onSaveGroqKey,
  geminiKey,
  onSaveGeminiKey,
  onClearAllData,
}: SettingsModalProps) {
  const [tempGroqKey, setTempGroqKey] = useState(groqKey || '');
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveGroqKey(tempGroqKey.trim());
    onSaveGeminiKey(tempGeminiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Motores de IA & Chaves</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Whisper Large v3 (Ultra Rápido) & Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chave Groq (Principal - Whisper) */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Chave Groq (Whisper Large v3 - Transcrição em &lt; 1s):
          </label>
          <input
            type="password"
            placeholder="gsk_..."
            value={tempGroqKey}
            onChange={(e) => setTempGroqKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Gratuita em <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">console.groq.com <ExternalLink className="w-2.5 h-2.5" /></a> (Processamento instantâneo de áudio).
          </p>
        </div>

        {/* Chave Gemini */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Chave Google Gemini:
          </label>
          <input
            type="password"
            placeholder="AQ.Ab8..."
            value={tempGeminiKey}
            onChange={(e) => setTempGeminiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5" /></a>.
          </p>
        </div>

        {/* Botão de Salvar */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-600/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Chaves Salvas no Aparelho!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>

        {/* Zona de Limpeza */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Dados do histórico local:</span>
          <button
            onClick={() => {
              if (confirm('Deseja apagar todas as aulas salvas localmente?')) {
                onClearAllData();
                onClose();
              }
            }}
            className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
