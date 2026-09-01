import { TranscriptionResponse, TranscriptSegment } from '@/types/lecture';

export const ACADEMIC_PROMPT = `
Você é um assistente acadêmico de elite e especialista em pedagogia universitária no Brasil.
Sua missão é analisar o texto transcrito de uma aula universitária/faculdade e estruturar um material de estudos completo, didático e altamente detalhado em Português Brasileiro (PT-BR).

INSTRUÇÕES OBRIGATÓRIAS:
1. TÍTULO E DISCIPLINA:
   - Identifique um título claro e a matéria da aula.

2. RESUMO EXECUTIVO DIDÁTICO:
   - Crie uma síntese clara dos principais pontos ensinados na aula, organizada em tópicos compreensíveis e objetivos.

3. RESUMO COMPLETO EM BULLET POINTS (ORDEM CRONOLÓGICA DA NARRATIVA DA AULA):
   - Este é o coração do estudo: crie um resumo minucioso e aprofundado seguindo RIGOROSAMENTE a ordem cronológica em que o professor falou na aula.
   - Estruture em tópicos e subtópicos numerados com marcadores de tópicos (-), com riqueza de detalhes, incluindo cada argumento, explicação, citação de artigo/lei/fórmula, distinções teóricas e exemplos dados pelo professor:
   
   Exemplo de formato para o campo "bulletSummary":
   "### 1. [00:00] Introdução e Contextualização do Tema
   - O professor iniciou a aula contextualizando a importância histórica do tema...
   - Definição do conceito central: X é caracterizado por Y e Z.
   - Exemplo dado em sala: caso concreto ilustrando a aplicação prática.
   
   ### 2. [12:45] Desenvolvimento dos Elementos Fundamentais
   - Primeiro requisito essencial apresentado pelo professor...
   - Diferenciação detalhada entre o instituto A e o instituto B.
   - Ponto de atenção reforçado: a exceção que costuma gerar dúvidas.
   
   ### 3. [28:30] Aplicações Práticas e Conclusões da Aula
   - Discussão sobre jurisprudência/doutrina/fórmulas aplicáveis.
   - Síntese dos desfechos e reflexões finais do professor."

4. TÓPICOS-CHAVE & QUADRO DE CONCEITOS:
   - Destaque os temas centrais abordados, com explicações didáticas e nível de importância ('alta', 'media', 'baixa').

5. ALERTAS DE PROVA & CONCEITOS CRÍTICOS:
   - Identifique e liste tudo que o professor deu ênfase especial, repetiu, disse que "vai cair na prova", "é pegadinha de exame", ou conceitos essenciais.

6. FLASHCARDS DE REVISÃO RÁPIDA:
   - Crie de 5 a 10 flashcards (Pergunta instigante e Resposta direta e completa) cobrindo os conceitos vitais da aula.

7. SIMULADO DE QUESTÕES (QUIZ):
   - Crie de 3 a 6 questões de múltipla escolha baseadas exatamente no conteúdo da aula, com 4 alternativas, índice da alternativa correta (0 a 3) e uma explicação detalhada do porquê.

8. GLOSSÁRIO DE TERMOS TÉCNICOS:
   - Mapeie palavras difíceis, siglas, nomes de teorias, leis ou conceitos introduzidos na aula com suas definições claras.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON PURO):
Você DEVE responder ESTRITAMENTE em formato JSON válido, sem qualquer texto introdutório antes ou depois.
Estrutura:
{
  "title": "Título da Aula",
  "subject": "Nome da Matéria/Disciplina",
  "summary": "Resumo executivo sintético...",
  "bulletSummary": "### 1. [00:00] Título do Tópico 1\\n- Item detalhado 1...\\n- Item detalhado 2...\\n\\n### 2. [15:00] Título do Tópico 2\\n- Item detalhado 1...\\n- Item detalhado 2...",
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
      "question": "Pergunta...",
      "answer": "Resposta..."
    }
  ],
  "quiz": [
    {
      "question": "Enunciado...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Justificativa..."
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
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converte Float32Array para formato WAV padrão (16-bit PCM Mono)
 */
function encodeWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Header RIFF
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');

  // Sub-chunk FMT (16-bit Mono PCM)
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // 1 Canal (Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate (16000 * 2)
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // Sub-chunk DATA
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Amostras PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Decodifica qualquer arquivo de áudio (.mp3, .m4a, .wav) no navegador,
 * converte para 16kHz Mono e divide em chunks seguros de 10 minutos (<=19MB).
 */
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

  // 1. Mistura canais para Mono
  const monoSamples = new Float32Array(audioBuffer.length);
  for (let c = 0; c < numChannels; c++) {
    const channelData = audioBuffer.getChannelData(c);
    for (let i = 0; i < audioBuffer.length; i++) {
      monoSamples[i] += channelData[i] / numChannels;
    }
  }

  // 2. Reamostragem para 16,000 Hz
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

  // 3. Fatiamento em partes de até maxChunkMinutes (10 minutos = 9.600.000 amostras = 19.2MB)
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
    // Ignora erro ao fechar contexto
  }

  return chunks;
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

  onProgress?.(3, 'Gerando resumo completo cronológico, flashcards e simulado...');

  // Estruturação didática com LLM em ~2 segundos
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
    }),
  });

  if (!llmRes.ok) {
    const err = await llmRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao estruturar notas de aula (Status ${llmRes.status})`);
  }

  const llmData = await llmRes.json();
  const rawJson = llmData.choices?.[0]?.message?.content || '{}';
  const studyKit = JSON.parse(rawJson);

  studyKit.segments = allSegments;
  onProgress?.(4, 'Concluído com sucesso!');
  return studyKit;
}
