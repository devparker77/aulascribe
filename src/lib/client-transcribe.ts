import { TranscriptionResponse, TranscriptSegment } from '@/types/lecture';

export const ACADEMIC_PROMPT = `
Você é um assistente acadêmico de elite e especialista em pedagogia universitária no Brasil.
Sua missão é analisar o texto transcrito de uma aula universitária/faculdade e estruturar um material de estudos completo, didático e altamente detalhado em Português Brasileiro (PT-BR).

INSTRUÇÕES OBRIGATÓRIAS (TODAS AS SEÇÕES SÃO OBRIGATÓRIAS):
1. TÍTULO E DISCIPLINA:
   - Identifique um título claro e a matéria da aula.

2. RESUMO EXECUTIVO DIDÁTICO:
   - Crie uma síntese clara dos principais pontos ensinados na aula.

3. RESUMO COMPLETO EM BULLET POINTS (ORDEM CRONOLÓGICA DA NARRATIVA DA AULA):
   - Crie um resumo minucioso e aprofundado seguindo RIGOROSAMENTE a ordem cronológica em que o professor falou na aula.
   - Estruture em tópicos numerados com marcadores de tópicos (-), com riqueza de detalhes, explicando conceitos, distinções e exemplos do professor.

4. TÓPICOS-CHAVE & QUADRO DE CONCEITOS:
   - Destaque os temas centrais abordados, com explicações completas e nível de importância ('alta', 'media', 'baixa').

5. ALERTAS DE PROVA & PONTOS CRÍTICOS:
   - Identifique e liste tudo que o professor deu ênfase especial, repetiu ou disse que vai cair em prova.

6. FLASHCARDS DE REVISÃO RÁPIDA (OBRIGATÓRIO GERAR DE 6 A 12 CARDS):
   - Crie obrigatoriamente de 6 a 12 flashcards ({ "question": "Pergunta objetiva e instigante?", "answer": "Resposta completa e didática." }) cobrindo os conceitos essenciais da aula.

7. SIMULADO DE QUESTÕES (QUIZ - OBRIGATÓRIO GERAR DE 3 A 6 QUESTÕES):
   - Crie questões de múltipla escolha com 4 alternativas, índice da correta (0 a 3) e justificativa.

8. GLOSSÁRIO DE TERMOS TÉCNICOS:
   - Mapeie palavras difíceis, siglas e conceitos com suas definições claras.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON PURO):
Responda ESTRITAMENTE em formato JSON válido:
{
  "title": "Título da Aula",
  "subject": "Nome da Matéria/Disciplina",
  "summary": "Resumo executivo...",
  "bulletSummary": "### 1. [00:00] Título do Tópico 1\\n- Ponto 1...\\n- Ponto 2...\\n\\n### 2. [15:00] Título do Tópico 2\\n- Ponto 1...",
  "keyTopics": [
    {
      "title": "Nome do Tópico",
      "explanation": "Explicação completa...",
      "importance": "alta"
    }
  ],
  "examAlerts": [
    "Atenção para o conceito X..."
  ],
  "flashcards": [
    {
      "question": "Pergunta de revisão 1?",
      "answer": "Resposta explicativa 1."
    },
    {
      "question": "Pergunta de revisão 2?",
      "answer": "Resposta explicativa 2."
    }
  ],
  "quiz": [
    {
      "question": "Enunciado da questão...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Justificativa da alternativa correta."
    }
  ],
  "glossary": [
    {
      "term": "Termo",
      "definition": "Definição..."
    }
  ]
}
`;

function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function encodeWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');

  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function splitAudioIntoWavChunks(
  file: File,
  maxChunkMinutes = 10,
  onProgress?: (msg: string) => void
): Promise<{ blob: Blob; startSecond: number; durationSeconds: number }[]> {
  onProgress?.('Otimizando áudio para processamento instantâneo...');

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    return [{ blob: file, startSecond: 0, durationSeconds: 0 }];
  }

  const audioCtx = new AudioCtx();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const targetSampleRate = 16000;
  const numChannels = audioBuffer.numberOfChannels;
  const originalSampleRate = audioBuffer.sampleRate;

  const monoSamples = new Float32Array(audioBuffer.length);
  for (let c = 0; c < numChannels; c++) {
    const channelData = audioBuffer.getChannelData(c);
    for (let i = 0; i < audioBuffer.length; i++) {
      monoSamples[i] += channelData[i] / numChannels;
    }
  }

  let resampledSamples: Float32Array;
  if (originalSampleRate === targetSampleRate) {
    resampledSamples = monoSamples;
  } else {
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(monoSamples.length / ratio);
    resampledSamples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origIndex = Math.round(i * ratio);
      resampledSamples[i] = monoSamples[origIndex] || 0;
    }
  }

  const samplesPerChunk = targetSampleRate * 60 * maxChunkMinutes;
  const chunks: { blob: Blob; startSecond: number; durationSeconds: number }[] = [];
  const totalChunks = Math.ceil(resampledSamples.length / samplesPerChunk);

  for (let c = 0; c < totalChunks; c++) {
    const start = c * samplesPerChunk;
    const end = Math.min(start + samplesPerChunk, resampledSamples.length);
    const chunkSamples = resampledSamples.subarray(start, end);
    const chunkBlob = encodeWav(chunkSamples, targetSampleRate);
    const startSecond = (start / targetSampleRate);
    const durationSeconds = (end - start) / targetSampleRate;

    chunks.push({
      blob: chunkBlob,
      startSecond,
      durationSeconds,
    });
  }

  try {
    await audioCtx.close();
  } catch (e) {
    // ignore
  }

  return chunks;
}

/**
 * Normaliza e garante que todos os campos e arrays (flashcards, quiz, tópicos) estejam preenchidos
 */
function normalizeStudyKit(raw: any, allSegments: any[]): TranscriptionResponse {
  const title = raw.title || raw.titulo || 'Aula Universitária';
  const subject = raw.subject || raw.disciplina || raw.materia || 'Geral';
  const summary = raw.summary || raw.resumo || 'Resumo da aula processado.';
  const bulletSummary = raw.bulletSummary || raw.bullet_summary || raw.resumo_completo || '';

  // 1. Tópicos Chave
  const rawTopics = raw.keyTopics || raw.key_topics || raw.topicos || raw.topics || [];
  const keyTopics = rawTopics.map((t: any) => ({
    title: t.title || t.titulo || t.nome || 'Tópico',
    explanation: t.explanation || t.explicacao || t.descricao || '',
    importance: t.importance || t.importancia || 'alta',
  }));

  // 2. Alertas de Prova
  const examAlerts = (raw.examAlerts || raw.exam_alerts || raw.alertas || raw.alerts || []).map((a: any) =>
    typeof a === 'string' ? a : a.text || a.alerta || JSON.stringify(a)
  );

  // 3. Flashcards (com fallback inteligente automático se vier vazio)
  const rawCards = raw.flashcards || raw.flash_cards || raw.cards || raw.cartoes || raw.flashCards || [];
  let flashcards = rawCards.map((c: any) => ({
    question: (c.question || c.pergunta || c.front || c.q || c.p || '').trim(),
    answer: (c.answer || c.resposta || c.back || c.a || c.r || '').trim(),
  })).filter((c: any) => c.question.length > 0 && c.answer.length > 0);

  // Fallback: se o LLM não gerou flashcards suficientes, gera automaticamente a partir dos tópicos e alertas
  if (flashcards.length === 0) {
    if (keyTopics.length > 0) {
      keyTopics.forEach((t: any) => {
        flashcards.push({
          question: `O que é ou como funciona o conceito de "${t.title}" segundo a aula?`,
          answer: t.explanation,
        });
      });
    }
    if (examAlerts.length > 0) {
      examAlerts.forEach((alert: string, i: number) => {
        flashcards.push({
          question: `Qual é o ponto crítico / alerta de prova destacado pelo professor (${i + 1})?`,
          answer: alert,
        });
      });
    }
  }

  // 4. Simulado (Quiz)
  const rawQuiz = raw.quiz || raw.questions || raw.simulado || raw.questoes || [];
  const quiz = rawQuiz.map((q: any) => ({
    question: q.question || q.pergunta || q.enunciado || 'Questão de revisão',
    options: Array.isArray(q.options || q.alternativas || q.choices)
      ? (q.options || q.alternativas || q.choices)
      : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.correta === 'number' ? q.correta : 0),
    explanation: q.explanation || q.explicacao || q.justificativa || 'Justificativa do gabarito.',
  }));

  // 5. Glossário
  const rawGlossary = raw.glossary || raw.glossario || raw.termos || [];
  const glossary = rawGlossary.map((g: any) => ({
    term: g.term || g.termo || g.palavra || 'Termo',
    definition: g.definition || g.definicao || g.significado || '',
  }));

  return {
    title,
    subject,
    summary,
    bulletSummary,
    segments: allSegments,
    keyTopics,
    examAlerts,
    flashcards,
    quiz,
    glossary,
  };
}

/**
 * Transcrição e Geração de Estudos com Groq Whisper Large v3 + Groq LLM
 */
export async function transcribeWithGroq(
  file: File,
  groqApiKey: string,
  subject?: string,
  onProgress?: (step: number, msg: string) => void
): Promise<TranscriptionResponse> {
  const activeKey = groqApiKey.trim();
  if (!activeKey) {
    throw new Error('Chave de API do Groq não configurada.');
  }

  let audioChunks: { blob: Blob; startSecond: number; durationSeconds: number }[] = [];

  // Se o arquivo for maior que 24MB, fatiamos via Web Audio API em partes seguras de 10 min
  if (file.size > 24 * 1024 * 1024) {
    onProgress?.(0, `Dividindo aula de ${(file.size / (1024 * 1024)).toFixed(1)}MB em partes otimizadas...`);
    try {
      audioChunks = await splitAudioIntoWavChunks(file, 10, (msg) => onProgress?.(0, msg));
    } catch (e) {
      console.warn('Falha no fatiador WebAudio, enviando arquivo diretamente:', e);
      audioChunks = [{ blob: file, startSecond: 0, durationSeconds: 0 }];
    }
  } else {
    audioChunks = [{ blob: file, startSecond: 0, durationSeconds: 0 }];
  }

  const allSegments: { time: string; speaker: string; text: string }[] = [];
  const fullTranscriptTexts: string[] = [];

  // Transcreve cada parte com Whisper Large v3
  for (let i = 0; i < audioChunks.length; i++) {
    const chunk = audioChunks[i];
    const chunkLabel = audioChunks.length > 1 ? ` (Parte ${i + 1}/${audioChunks.length})` : '';
    onProgress?.(1, `Transcrevendo áudio com Whisper Large v3${chunkLabel}...`);

    const formData = new FormData();
    formData.append('file', chunk.blob, `aula_part_${i}.wav`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'pt');

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
      },
      body: formData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro no Whisper da Groq (Status ${whisperRes.status})`);
    }

    const whisperData = await whisperRes.json();
    const chunkText = (whisperData.text || '').trim();
    if (chunkText) {
      fullTranscriptTexts.push(chunkText);
    }

    const rawSegments = whisperData.segments || [];
    for (const s of rawSegments) {
      const absoluteSeconds = chunk.startSecond + (s.start || 0);
      allSegments.push({
        time: formatSecondsToTime(absoluteSeconds),
        speaker: 'Professor',
        text: (s.text || '').trim(),
      });
    }
  }

  const completeTranscript = fullTranscriptTexts.join('\n\n');

  if (allSegments.length === 0 && completeTranscript) {
    allSegments.push({
      time: '00:00',
      speaker: 'Professor',
      text: completeTranscript,
    });
  }

  onProgress?.(3, 'Gerando resumo completo, flashcards 3D e simulado com IA...');

  // Estruturação didática com LLM em ~2 segundos com 4096 tokens de limite
  const prompt = `${ACADEMIC_PROMPT}\n\nDisciplina sugerida: "${subject || 'Geral'}".\n\nTRANSCRIÇÃO COMPLETA DA AULA:\n"""\n${completeTranscript.substring(0, 60000)}\n"""`;

  const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${activeKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_completion_tokens: 4096,
    }),
  });

  if (!llmRes.ok) {
    const err = await llmRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao estruturar notas de aula (Status ${llmRes.status})`);
  }

  const llmData = await llmRes.json();
  const rawJson = llmData.choices?.[0]?.message?.content || '{}';
  const rawParsed = JSON.parse(rawJson);

  const studyKit = normalizeStudyKit(rawParsed, allSegments);
  onProgress?.(4, 'Concluído com sucesso!');
  return studyKit;
}
