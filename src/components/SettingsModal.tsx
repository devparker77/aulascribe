'use client';

import React, { useState } from 'react';
import { X, Key, Sparkles, ExternalLink, Check, Trash2, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onClearAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  onClearAllData,
}: SettingsModalProps) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveApiKey(tempKey.trim());
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
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Configurações & Chave IA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Acesso ilimitado e gratuito ao Gemini 3.7 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modelo de IA Selecionado */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            Modelo Gemini Utilizado:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini-3.7-flash">Gemini 3.7 Flash (Mais recente, alta precisão & multimodal)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* Campo de Chave de API */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-500" />
              Chave de API do Google Gemini (Opcional se já estiver no servidor):
            </span>
          </label>

          <input
            type="password"
            placeholder="AIzaSy..."
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Como obter uma chave 100% gratuita em 1 minuto:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5" /></a> com sua conta Google.</li>
              <li>Clique no botão azul <strong>"Create API Key"</strong>.</li>
              <li>Copie o código gerado e cole no campo acima!</li>
            </ol>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-600/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Configurações Salvas!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>

        {/* Zona de Limpeza */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Dados salvos no seu navegador:</span>
          <button
            onClick={() => {
              if (confirm('Deseja apagar todas as aulas e transcrições salvas localmente?')) {
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
