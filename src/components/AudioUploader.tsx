'use client';

import React, { useState, useRef } from 'react';
import { Upload, Mic, Square, Play, Pause, FileAudio, Sparkles, CheckCircle2, AlertCircle, Loader2, BookOpen, Zap } from 'lucide-react';
import { TranscriptionResponse } from '@/types/lecture';
import { transcribeWithGroq } from '@/lib/client-transcribe';

interface AudioUploaderProps {
  onTranscriptionSuccess: (data: TranscriptionResponse, audioBlob: Blob | undefined, durationSeconds: number) => void;
  groqKey?: string;
  geminiKey?: string;
  onOpenSettings?: () => void;
}

export function AudioUploader({ onTranscriptionSuccess, groqKey, geminiKey, onOpenSettings }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressStep, setProgressStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados da Gravação ao Vivo
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    'Preparando gravação da aula...',
    'Transcrevendo áudio com Whisper Large v3...',
    'Identificando termos técnicos e timestamps...',
    'Sintetizando resumo, tópicos de prova e flashcards 3D...',
    'Pronto! Material de estudos gerado.'
  ];

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Gravação ao vivo
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([audioBlob], `Gravacao_Aula_${new Date().toISOString().substring(0, 10)}.webm`, {
          type: 'audio/webm',
        });
        setSelectedFile(recordedFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setErrorMsg('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Envio e Processamento com IA (Whisper Large v3 + LLM)
  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMsg('Selecione ou grave um arquivo de áudio primeiro.');
      return;
    }

    const activeGroqKey = groqKey?.trim() || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

    setIsLoading(true);
    setProgressStep(0);
    setStatusMessage('Iniciando transcrição com Whisper Large v3...');
    setErrorMsg(null);

    try {
      console.log('[AulaScribe] Executando pipeline ultra rápido com Groq Whisper Large v3...');
      const transcriptionResult = await transcribeWithGroq(
        selectedFile,
        activeGroqKey,
        subject,
        (step, msg) => {
          setProgressStep(step);
          setStatusMessage(msg);
        }
      );

      setTimeout(() => {
        onTranscriptionSuccess(
          transcriptionResult,
          selectedFile,
          recordingTime > 0 ? recordingTime : 0
        );
      }, 400);
    } catch (err: any) {
      console.error('Erro na transcrição:', err);
      setErrorMsg(err.message || 'Falha ao processar gravação. Verifique as configurações.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-0">
      {/* Card Principal */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-700 backdrop-blur-sm">
        
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-3">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transcrever Aula com IA
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Envie a gravação da aula (.m4a do iPhone, .mp3 ou grave ao vivo) para obter transcrição com Whisper Large v3, resumo e flashcards.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Motor Turbo: Whisper Large v3 Ativo (Processamento em segundos)
          </div>
        </div>

        {/* Campo Opcional de Disciplina */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            Disciplina / Matéria (Opcional):
          </label>
          <input
            type="text"
            placeholder="Ex: Direito Civil, Bioquímica, Cálculo II..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Área de Seleção de Arquivo e Gravação */}
        {!isLoading ? (
          <div className="space-y-4">
            {/* Zona de Drop & Upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <input
                type="file"
                id="audio-input"
                accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.mp4"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="max-w-full px-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Toque para trocar
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Toque para escolher o áudio da aula
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Formatos aceitos: .m4a (Gravador do iPhone), .mp3, .wav, .aac, .ogg
                  </p>
                </div>
              )}
            </div>

            {/* Divisor ou Gravação ao Vivo */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-slate-800 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ou grave no microfone
              </span>
            </div>

            {/* Caixa de Gravação ao Vivo */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isRecording ? (isPaused ? 'bg-amber-400' : 'bg-red-500 animate-ping') : 'bg-slate-400'}`} />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isRecording
                      ? isPaused
                        ? 'Gravação pausada'
                        : 'Gravando áudio da aula...'
                      : 'Gravação ao vivo'}
                  </p>
                  <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(recordingTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Iniciar Gravação
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition-all active:scale-95"
                      title={isPaused ? 'Retomar' : 'Pausar'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 active:scale-95 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Concluir
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mensagem de Erro se houver */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-shake">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="self-end sm:self-auto px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] whitespace-nowrap active:scale-95 transition-all shadow-xs"
                  >
                    Ver Configurações ⚙️
                  </button>
                )}
              </div>
            )}

            {/* Botão de Envio */}
            <button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
                selectedFile
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Transcrever e Gerar Material de Estudo
            </button>
          </div>
        ) : (
          /* Estado de Carregamento */
          <div className="py-8 px-4 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-900 animate-pulse" />
              <Loader2 className="w-8 h-8 text-amber-500 dark:text-amber-400 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {statusMessage || 'Processando Aula com Whisper Large v3'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Transcrição ultra rápida com inteligência acadêmica.
              </p>
            </div>

            {/* Lista de Etapas */}
            <div className="max-w-md mx-auto space-y-2.5 text-left">
              {steps.map((text, idx) => {
                const isCurrent = progressStep === idx;
                const isDone = progressStep > idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                        : isDone
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dica para iPhone */}
      <div className="mt-4 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <span className="text-base">💡</span>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Dica para gravação no iPhone:
          </p>
          <p className="mt-0.5 leading-relaxed">
            No aplicativo nativo <strong>Gravador de Voz</strong> do iPhone, toque nos três pontinhos (...) ao lado da gravação da aula, toque em <strong>Compartilhar</strong> e escolha salvar em <em>Arquivos</em> ou envie diretamente para o Safari!
          </p>
        </div>
      </div>
    </div>
  );
}
