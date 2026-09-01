'use client';

import React from 'react';
import { X, Smartphone, Mic, Share2, PlusSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

interface IOSGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSGuideModal({ isOpen, onClose }: IOSGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Como Usar no iPhone</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Guia passo a passo para gravações de aula</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passos */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* Passo 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
              <Mic className="w-4 h-4" />
              <span>Grave a aula no app nativo Gravador (Voice Memos)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
              Abra o aplicativo <strong>Gravador</strong> que já vem de fábrica no iPhone e deixe gravando durante a aula da faculdade. Ele consome pouca bateria e suporta gravações de várias horas em formato .m4a leve.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
              <Share2 className="w-4 h-4" />
              <span>Envie para o AulaScribe</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
              Após terminar a gravação, toque nos <strong>três pontinhos (...)</strong> ao lado do áudio, selecione <strong>"Compartilhar"</strong> e salve em <em>"Arquivos"</em>. Em seguida, no Safari, toque no botão de escolher áudio e selecione a gravação!
            </p>
          </div>

          {/* Passo 3 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
              <PlusSquare className="w-4 h-4" />
              <span>Adicione à Tela de Início (Vira App!)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
              No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima na barra inferior) e escolha <strong>"Adicionar à Tela de Início"</strong>. Um ícone do AulaScribe ficará disponível na tela do iPhone como um aplicativo nativo.
            </p>
          </div>

        </div>

        {/* Botão de Concluir */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all active:scale-95"
        >
          Entendi, vamos começar!
        </button>
      </div>
    </div>
  );
}
