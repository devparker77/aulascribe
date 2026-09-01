import { GoogleGenAI, type File as GenAIFile } from '@google/genai';
import { TranscriptionResponse } from '@/types/lecture';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Chave da API do Google Gemini não encontrada. Por favor, forneça sua chave gratuita do Google AI Studio nas configurações ou no arquivo .env.local'
    );
  }
  return new GoogleGenAI({ apiKey });
}

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

/**
 * Processa a transcrição e material de estudos a partir de um File URI pré-carregado no Google Files API.
 * Ideal para arquivos de qualquer tamanho (50MB, 100MB, 500MB+) sem passar pelo limite da Vercel.
 */
export async function processFileUriWithGemini(
  fileUri: string,
  fileName?: string,
  mimeType: string = 'audio/mp3',
  customApiKey?: string,
  modelName: string = 'gemini-3.6-flash'
): Promise<TranscriptionResponse> {
  const ai = getGeminiClient(customApiKey);

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    modelName
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;
  let responseText = '';

  for (const currentModel of candidateModels) {
    try {
      console.log(`[Gemini] Processando fileUri com modelo: ${currentModel}...`);
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            fileData: {
              fileUri: fileUri,
              mimeType: mimeType || 'audio/mp3',
            },
          },
          ACADEMIC_PROMPT,
        ],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      responseText = response.text || '';
      if (responseText) {
        console.log(`[Gemini] Transcrição concluída via ${currentModel}!`);
        break;
      }
    } catch (modelErr: any) {
      console.warn(`[Gemini] Modelo ${currentModel} falhou (${modelErr.message}). Tentando fallback...`);
      lastError = modelErr;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Limpeza na nuvem (Google Files API)
  if (fileName) {
    try {
      await ai.files.delete({ name: fileName });
      console.log(`[Gemini] Arquivo remoto ${fileName} excluído.`);
    } catch (delErr) {
      console.warn('Aviso: Erro ao excluir arquivo remoto:', delErr);
    }
  }

  if (!responseText) {
    throw lastError || new Error('Nenhum dos modelos disponíveis respondeu.');
  }

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleanJson);
}

/**
 * Processa a partir de um Buffer em memória (útil para desenvolvimento local ou áudios gravados direto no mic).
 */
export async function processAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  customApiKey?: string,
  modelName: string = 'gemini-3.6-flash'
): Promise<TranscriptionResponse> {
  const ai = getGeminiClient(customApiKey);
  
  const tempDir = os.tmpdir();
  const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? '.m4a' :
              mimeType.includes('mpeg') || mimeType.includes('mp3') ? '.mp3' :
              mimeType.includes('wav') ? '.wav' :
              mimeType.includes('aac') ? '.aac' :
              mimeType.includes('ogg') ? '.ogg' : '.audio';
              
  const tempFilePath = path.join(tempDir, `aulascribe_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  
  let uploadedFile: GenAIFile | null = null;
  
  try {
    await fs.writeFile(tempFilePath, audioBuffer);
    
    uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: mimeType || 'audio/mp3',
      },
    });

    console.log(`[Gemini] Áudio local enviado para Google Files API. ID: ${uploadedFile.name}`);

    return await processFileUriWithGemini(
      uploadedFile.uri || '',
      uploadedFile.name,
      uploadedFile.mimeType || mimeType,
      customApiKey,
      modelName
    );
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch {}
  }
}
