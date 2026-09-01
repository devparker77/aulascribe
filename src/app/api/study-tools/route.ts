import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const customApiKey = request.headers.get('x-gemini-api-key') || undefined;
    const body = await request.json();
    const { action, lectureTitle, lectureSubject, transcriptText, question, concept } = body;

    const ai = getGeminiClient(customApiKey);

    if (action === 'ask-tutor') {
      const prompt = `
Você é o monitor/tutor universitário da disciplina "${lectureSubject}".
A estudante está com uma dúvida sobre a seguinte aula gravada: "${lectureTitle}".

CONTEÚDO / TRANSCRIÇÃO DA AULA:
${transcriptText ? transcriptText.substring(0, 40000) : 'Não disponível'}

PERGUNTA DA ESTUDANTE:
"${question}"

INSTRUÇÕES:
- Responda de forma extremamente clara, didática, encorajadora e precisa.
- Baseie-se no que o professor ensinou na aula, complementando com exemplos fáceis se ajudar na compreensão.
- Use formatação Markdown limpa (tópicos, negritos).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return NextResponse.json({
        success: true,
        answer: response.text || 'Não foi possível gerar a resposta.',
      });
    }

    if (action === 'explain-simple') {
      const prompt = `
Você é um professor premiado por explicar conceitos complexos de forma ultra simples e intuitiva (técnica Feynman).
Aula: "${lectureTitle}" (${lectureSubject}).

CONCEITO OU TERMO PARA EXPLICAR:
"${concept}"

CONTEXTO DA AULA:
${transcriptText ? transcriptText.substring(0, 15000) : ''}

INSTRUÇÕES:
1. Explique esse conceito como se estivesse explicando para alguém iniciante, usando uma analogia do cotidiano memorável.
2. Diga por que esse conceito é importante na prática.
3. Dê um exemplo direto e claro.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return NextResponse.json({
        success: true,
        explanation: response.text || 'Não foi possível gerar a explicação.',
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    console.error('[Study Tools API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar ferramenta de estudos.' },
      { status: 500 }
    );
  }
}
