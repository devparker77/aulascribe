export interface TranscriptSegment {
  id: string;
  time: string; // e.g. "04:15"
  seconds: number; // e.g. 255
  speaker: string; // e.g. "Professor", "Aluno"
  text: string;
}

export interface KeyTopic {
  title: string;
  explanation: string;
  importance?: 'alta' | 'media' | 'baixa';
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  createdAt: number;
  durationSeconds?: number;
  audioBlob?: Blob;
  audioUrl?: string;
  
  // Conteúdo gerado pela IA
  rawTranscription: string;
  segments: TranscriptSegment[];
  summary: string;
  bulletSummary?: string; // Resumo completo cronológico em tópicos e bullet points
  keyTopics: KeyTopic[];
  examAlerts: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  glossary: GlossaryItem[];
  
  // Metadados
  wordCount?: number;
  modelUsed?: string;
}

export interface TranscriptionResponse {
  title: string;
  subject: string;
  summary: string;
  bulletSummary?: string;
  segments: {
    time: string;
    speaker: string;
    text: string;
  }[];
  keyTopics: {
    title: string;
    explanation: string;
    importance?: 'alta' | 'media' | 'baixa';
  }[];
  examAlerts: string[];
  flashcards: {
    question: string;
    answer: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  glossary: {
    term: string;
    definition: string;
  }[];
}
