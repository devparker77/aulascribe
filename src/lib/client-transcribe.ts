import { TranscriptionResponse } from '@/types/lecture';

export const ACADEMIC_PROMPT = `
Você é um assistente acadêmico de elite e especialista em transcrição e pedagogia universitária no Brasil.
Sua missão é ouvir atentamente este arquivo de áudio de uma aula universitária/faculdade e realizar uma transcrição completa, fiel e didática em Português Brasileiro (PT-BR), além de estruturar um material de estudos completo para a estudante.

INSTRUÇÕES OBRIGATÓRIAS:
1. TRANSCRIÇÃO DETALHADA E SEGMENTADA:
   - Transcreva o que foi dito de forma literal, mantendo a precisão dos termos técnicos, artigos de lei, fórmulas ou conceitos explicados.
   - Divida o áudio em segmentos cronológicos com marcação de tempo [MM:SS] aproximada para cada mudança de pensamento ou fala.
   - Identifique quem está falando quando possível (ex: "Professor", "Aluno", "Professora").

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
Você DEVE responder ESTRITAMENTE em formato JSON válido, sem qualquer texto introdutório ou markdown antes/depois do bloco JSON.
Siga rigorosamente a seguinte estrutura:

{
  "title": "Título Claro e Específico da Aula (ex: Direito Constitucional: Direitos Fundamentais)",
  "subject": "Nome da Matéria/Disciplina Identificada (ex: Direito Constitucional)",
  "summary": "Resumo estruturado em markdown com introdução, desenvolvimento dos temas e conclusões.",
  "segments": [
    {
      "time": "00:00",
      "speaker": "Professor",
      "text": "Texto exato falado neste trecho..."
    },
    {
      "time": "02:15",
      "speaker": "Aluno",
      "text": "Dúvida do aluno..."
    }
  ],
  "keyTopics": [
    {
      "title": "Nome do Tópico",
      "explanation": "Explicação completa e didática do conceito com exemplos.",
      "importance": "alta"
    }
  ],
  "examAlerts": [
    "Atenção para a distinção entre X e Y que o professor repetiu 3 vezes.",
    "O professor mencionou que o caso Z será cobrado na prova P1."
  ],
  "flashcards": [
    {
      "question": "O que é o princípio da proporcionalidade segundo a aula?",
      "answer": "É o critério de adequação, necessidade e proporcionalidade em sentido estrito..."
    }
  ],
  "quiz": [
    {
      "question": "Qual foi a principal crítica apresentada na aula a respeito de...",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 0,
      "explanation": "A opção A está correta porque o professor destacou que..."
    }
  ],
  "glossary": [
    {
      "term": "Termo Técnico",
      "definition": "Significado e contexto acadêmico..."
    }
  ]
}
`;

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

export async function transcribeDirectlyWithGemini(
  file: File,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash',
  subject?: string,
  onProgress?: (step: number, msg: string) => void
): Promise<TranscriptionResponse> {
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não informada.');
  }

  onProgress?.(0, 'Preparando áudio da aula...');
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (file.name.endsWith('.m4a') ? 'audio/mp4' : 'audio/mp3');

  const candidateModels = [
    modelName,
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let responseData: any = null;
  let lastError: any = null;

  for (const currentModel of candidateModels) {
    // Tenta até 3 vezes por modelo em caso de pico momentâneo (503)
    for (let attempt = 1; attempt <= 3; attempt++) {
      onProgress?.(
        1,
        attempt > 1
          ? `Aguardando liberação de cota no Gemini (${currentModel}, tentativa ${attempt}/3)...`
          : `Processando áudio com Gemini (${currentModel})...`
      );

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: subject ? `${ACADEMIC_PROMPT}\n\nObservação da Estudante: A matéria desta aula é "${subject}".` : ACADEMIC_PROMPT,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.status === 503 || res.status === 429) {
          console.warn(`[Gemini] ${currentModel} com pico de demanda (503/429). Aguardando ${attempt * 2}s...`);
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error?.message || `Erro HTTP ${res.status}`);
        }

        responseData = await res.json();
        if (responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Tentativa ${attempt} com ${currentModel} falhou:`, err.message);
        lastError = err;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      break;
    }
  }

  if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw lastError || new Error('O Gemini está temporariamente sobrecarregado no momento. Por favor, aguarde alguns segundos e clique novamente.');
  }

  onProgress?.(3, 'Sintetizando resumo, tópicos de prova e flashcards...');

  const rawText = responseData.candidates[0].content.parts[0].text;
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const parsed: TranscriptionResponse = JSON.parse(cleanJson);
  onProgress?.(4, 'Pronto! Dossiê de estudos gerado.');
  return parsed;
}
