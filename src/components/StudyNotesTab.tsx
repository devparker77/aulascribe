'use client';

import React, { useState } from 'react';
import { Lecture, Flashcard, KeyTopic, QuizQuestion, GlossaryItem } from '@/types/lecture';
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  XCircle,
  RotateCw,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyNotesTabProps {
  lecture: Lecture;
  onUpdateFlashcardMastery?: (flashcardId: string, mastered: boolean) => void;
  apiKey?: string;
}

export function StudyNotesTab({ lecture, onUpdateFlashcardMastery, apiKey }: StudyNotesTabProps) {
  const [activeSection, setActiveSection] = useState<'summary' | 'topics' | 'flashcards' | 'quiz' | 'tutor'>('summary');

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const getInitialFlashcards = (): Flashcard[] => {
    if (lecture.flashcards && lecture.flashcards.length > 0) {
      return lecture.flashcards;
    }
    if (lecture.keyTopics && lecture.keyTopics.length > 0) {
      return lecture.keyTopics.map((t, idx) => ({
        id: `fc_fallback_${idx}`,
        question: `O que é e como funciona "${t.title}" segundo a aula?`,
        answer: t.explanation,
        mastered: false,
      }));
    }
    return [];
  };

  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(getInitialFlashcards());

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  // Tutor IA state
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorChat, setTutorChat] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Modal de Explicação Simples
  const [explainingTopic, setExplainingTopic] = useState<string | null>(null);
  const [simpleExplanation, setSimpleExplanation] = useState<string | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);

  // Flashcard controls
  const currentCard = localFlashcards[currentCardIndex];

  const handleCardResult = (mastered: boolean) => {
    if (!currentCard) return;

    const updated = localFlashcards.map((c, i) =>
      i === currentCardIndex ? { ...c, mastered } : c
    );
    setLocalFlashcards(updated);
    if (onUpdateFlashcardMastery) {
      onUpdateFlashcardMastery(currentCard.id, mastered);
    }

    setIsFlipped(false);
    if (currentCardIndex < localFlashcards.length - 1) {
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 200);
    } else {
      // Finalizou o deck! Lança confete de comemoração
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Quiz answer selection
  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
    setShowResults((prev) => ({ ...prev, [questionIdx]: true }));
  };

  // Tutor IA request
  const handleSendTutorMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || tutorQuery;
    if (!textToSend.trim()) return;

    const newChat = [...tutorChat, { role: 'user' as const, text: textToSend }];
    setTutorChat(newChat);
    setTutorQuery('');
    setIsTutorLoading(true);

    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          action: 'ask-tutor',
          lectureTitle: lecture.title,
          lectureSubject: lecture.subject,
          transcriptText: lecture.rawTranscription || lecture.segments.map((s) => s.text).join(' '),
          question: textToSend,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTutorChat([...newChat, { role: 'assistant', text: data.answer }]);
      } else {
        setTutorChat([...newChat, { role: 'assistant', text: 'Desculpe, ocorreu um erro ao consultar a IA.' }]);
      }
    } catch {
      setTutorChat([...newChat, { role: 'assistant', text: 'Erro de conexão com o servidor.' }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Solicitar explicação simples (Feynman)
  const handleExplainSimple = async (topicTitle: string, topicExplanation: string) => {
    setExplainingTopic(topicTitle);
    setSimpleExplanation(null);
    setIsExplainingLoading(true);

    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          action: 'explain-simple',
          lectureTitle: lecture.title,
          lectureSubject: lecture.subject,
          transcriptText: lecture.rawTranscription,
          concept: `${topicTitle}: ${topicExplanation}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimpleExplanation(data.explanation);
      } else {
        setSimpleExplanation('Não foi possível gerar a explicação simplificada.');
      }
    } catch {
      setSimpleExplanation('Erro ao conectar com a IA.');
    } finally {
      setIsExplainingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu Superior de Sub-Abas do Modo Estudo */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700/60 no-scrollbar">
        <button
          onClick={() => setActiveSection('summary')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeSection === 'summary'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Resumo & Alertas
        </button>

        <button
          onClick={() => setActiveSection('topics')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeSection === 'topics'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Tópicos ({lecture.keyTopics?.length || 0})
        </button>

        <button
          onClick={() => setActiveSection('flashcards')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeSection === 'flashcards'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Flashcards ({localFlashcards.length})
        </button>

        <button
          onClick={() => setActiveSection('quiz')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeSection === 'quiz'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Simulado ({lecture.quiz?.length || 0})
        </button>

        <button
          onClick={() => setActiveSection('tutor')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            activeSection === 'tutor'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Monitor IA da Aula
        </button>
      </div>

      {/* SEÇÃO 1: RESUMO & ALERTAS DE PROVA */}
      {activeSection === 'summary' && (
        <div className="space-y-6">
          {/* Caixa de Alertas de Prova */}
          {lecture.examAlerts && lecture.examAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Pontos Críticos & Alertas para a Prova
                </h3>
              </div>
              <ul className="space-y-2">
                {lecture.examAlerts.map((alert, idx) => (
                  <li key={idx} className="text-xs sm:text-sm flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumo Executivo */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Resumo Executivo da Aula
            </h3>
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {lecture.summary}
            </div>
          </div>

          {/* Glossário Técnico */}
          {lecture.glossary && lecture.glossary.length > 0 && (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Glossário de Termos Técnicos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lecture.glossary.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                    <p className="font-bold text-xs text-blue-600 dark:text-blue-400">{item.term}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 2: TÓPICOS DA AULA */}
      {activeSection === 'topics' && (
        <div className="space-y-4">
          {lecture.keyTopics?.map((topic, idx) => {
            const isHigh = topic.importance === 'alta';
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {topic.title}
                    </h4>
                  </div>

                  {topic.importance && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isHigh
                          ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      Importância {topic.importance}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {topic.explanation}
                </p>

                {/* Botão de Explicar Simples */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                  <button
                    onClick={() => handleExplainSimple(topic.title, topic.explanation)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Explicar de forma super simples
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEÇÃO 3: FLASHCARDS DE REVISÃO */}
      {activeSection === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-6">
          {localFlashcards.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Nenhum flashcard gerado.</p>
          ) : (
            <>
              {/* Barra de Progresso */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>
                  Card {currentCardIndex + 1} de {localFlashcards.length}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {localFlashcards.filter((c) => c.mastered).length} dominados
                </span>
              </div>

              {/* Card 3D com Flip */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative h-64 sm:h-72 w-full cursor-pointer perspective-1000 group select-none"
              >
                <div
                  className={`w-full h-full rounded-2xl p-6 shadow-xl border transition-all duration-500 transform flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-500/50'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                      {isFlipped ? 'Resposta' : 'Pergunta'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <RotateCw className="w-3 h-3" /> Toque para virar
                    </span>
                  </div>

                  <div className="my-auto text-center px-2">
                    <p className={`font-semibold leading-relaxed ${isFlipped ? 'text-sm sm:text-base text-indigo-100' : 'text-base sm:text-lg'}`}>
                      {isFlipped ? currentCard?.answer : currentCard?.question}
                    </p>
                  </div>

                  <div className="text-center text-[11px] text-slate-400">
                    {isFlipped ? 'Como foi seu desempenho?' : 'Tente lembrar da resposta antes de virar'}
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Flashcard */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleCardResult(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <RotateCw className="w-4 h-4" />
                  Preciso Revisar
                </button>

                <button
                  onClick={() => handleCardResult(true)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Acertei! 🎉
                </button>
              </div>

              {/* Reiniciar Deck */}
              {currentCardIndex === localFlashcards.length - 1 && (
                <div className="text-center pt-2">
                  <button
                    onClick={resetFlashcards}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recomeçar Flashcards
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SEÇÃO 4: SIMULADO & QUESTÕES */}
      {activeSection === 'quiz' && (
        <div className="space-y-6">
          {lecture.quiz?.map((q, qIdx) => {
            const hasAnswered = showResults[qIdx];
            const selectedOpt = selectedAnswers[qIdx];

            return (
              <div
                key={qIdx}
                className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {q.question}
                  </h4>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isCorrect = optIdx === q.correctIndex;

                    let btnStyle = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200';
                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                      } else {
                        btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-all active:scale-[0.99] ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && q.explanation && (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">Explicação do Professor:</p>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SEÇÃO 5: TUTOR IA (CHAT COM A AULA) */}
      {activeSection === 'tutor' && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Monitor IA da Aula</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tire qualquer dúvida sobre o que o professor falou.</p>
            </div>
          </div>

          {/* Sugestões Rápidas */}
          {tutorChat.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Perguntas sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'O que o professor mais enfatizou para a prova?',
                  'Faça um resumo ultra rápido em 3 tópicos.',
                  'Quais exemplos práticos foram citados?',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendTutorMessage(sug)}
                    className="text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-700/70 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-600"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Histórico do Chat */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {tutorChat.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/80 dark:border-slate-600'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTutorLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>O Monitor IA está consultando o áudio da aula...</span>
              </div>
            )}
          </div>

          {/* Caixa de Entrada de Mensagem */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Digite sua dúvida sobre a aula..."
              value={tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMessage()}
              disabled={isTutorLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendTutorMessage()}
              disabled={isTutorLoading || !tutorQuery.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal / Card de Explicação Simplificada */}
      {explainingTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Explicação Simplificada</h4>
              </div>
              <button
                onClick={() => setExplainingTopic(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{explainingTopic}</p>

            {isExplainingLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500">Transformando em uma analogia simples e memorável...</p>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                {simpleExplanation}
              </div>
            )}

            <button
              onClick={() => setExplainingTopic(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
