import { TranscriptionResponse, TranscriptSegment } from '@/types/lecture';

export const ACADEMIC_PROMPT = `
Você é um assistente acadêmico de elite e especialista em pedagogia universitária no Brasil.
Sua missão é analisar o texto transcrito de uma aula universitária/faculdade e estruturar um material de estudos completo, de alta fidelidade didática em Português Brasileiro (PT-BR).

INSTRUÇÕES OBRIGATÓRIAS:
1. TÍTULO E DISCIPLINA:
   - Identifique um título claro e a matéria da aula.

2. RESUMO EXECUTIVO DIDÁTICO:
   - Crie uma síntese clara dos principais pontos ensinados na aula, organizada em tópicos compreensíveis e objetivos.

3. TÓPICOS-CHAVE & QUADRO DE CONCEITOS:
   - Destaque os temas centrais abordados, com explicações detalhadas e exemplos práticos citados pelo professor.
   - Indique o nível de importância de cada tópico ('alta', 'media', 'baixa').

4. ALERTAS DE PROVA & CONCEITOS CRÍTICOS:
   - Identifique e liste tudo que o professor deu ênfase especial, repetiu, disse que "vai cair na prova", "é pegadinha de exame", ou conceitos essenciais.

5. FLASHCARDS DE REVISÃO RÁPIDA:
   - Crie de 5 a 10 flashcards (Pergunta instigante e Resposta direta e completa) cobrindo os conceitos vitais da aula.

6. SIMULADO DE QUESTÕES (QUIZ):
   - Crie de 3 a 6 questões de múltipla escolha baseadas exatamente no conteúdo da aula, com 4 alternativas, índice da alternativa correta (0 a 3) e uma explicação detalhada do porquê.

7. GLOSSÁRIO DE TERMOS TÉCNICOS:
   - Mapeie palavras difíceis, siglas, nomes de teorias, leis ou conceitos introduzidos na aula com suas definições claras.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON PURO):
Você DEVE responder ESTRITAMENTE em formato JSON válido, sem qualquer texto introdutório antes ou depois.
Estrutura:
{
  "title": "Título da Aula",
  "subject": "Nome da Matéria/Disciplina",
  "summary": "Resumo estruturado da aula...",
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
 * Transcrição e Geração de Estudos com Groq Whisper Large v3 + Groq LLM (Ultra Rápido, 100% Estável)
 */
export async function transcribeWithGroq(
  file: File,
  groqApiKey: string,
  subject?: string,
  onProgress?: (step: number, msg: string) => void
): Promise<TranscriptionResponse> {
  onProgress?.(1, 'Transcrevendo áudio com Groq Whisper Large v3...');

  // 1. Transcrição de áudio com Whisper Large v3
  const formData = new FormData();
  formData.append('file', file, file.name || 'aula.mp3');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'verbose_json');
  formData.append('language', 'pt');

  const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey.trim()}`,
    },
    body: formData,
  });

  if (!whisperRes.ok) {
    const err = await whisperRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro no Whisper da Groq (Status ${whisperRes.status})`);
  }

  const whisperData = await whisperRes.json();
  const transcriptText = whisperData.text || '';
  const rawSegments = whisperData.segments || [];

  // Mapeia segmentos com timestamps [MM:SS]
  const formattedSegments: { time: string; speaker: string; text: string }[] = rawSegments.map((s: any, idx: number) => ({
    time: formatSecondsToTime(s.start || 0),
    speaker: idx % 3 === 0 ? 'Professor' : 'Professor',
    text: (s.text || '').trim(),
  }));

  if (formattedSegments.length === 0 && transcriptText) {
    formattedSegments.push({
      time: '00:00',
      speaker: 'Professor',
      text: transcriptText,
    });
  }

  onProgress?.(3, 'Gerando resumo, flashcards 3D e simulado com IA...');

  // 2. Estruturação didática com LLM de alta velocidade
  const prompt = `${ACADEMIC_PROMPT}\n\nDisciplina sugerida: "${subject || 'Geral'}".\n\nTRANSCRIÇÃO COMPLETA DA AULA:\n"""\n${transcriptText.substring(0, 50000)}\n"""`;

  const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey.trim()}`,
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

  studyKit.segments = formattedSegments;
  onProgress?.(4, 'Concluído com sucesso!');
  return studyKit;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}
