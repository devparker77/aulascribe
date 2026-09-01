import { NextRequest, NextResponse } from 'next/server';
import { processAudioWithGemini } from '@/lib/gemini';

// Aumenta o tempo limite de execução para processamento de áudios longos
export const maxDuration = 300; // 5 minutos de timeout
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const customApiKey = request.headers.get('x-gemini-api-key') || undefined;
    const modelHeader = request.headers.get('x-gemini-model') || 'gemini-3.7-flash';

    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio foi enviado. Por favor, selecione uma gravação.' },
        { status: 400 }
      );
    }

    console.log(`[Transcribe API] Recebido arquivo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB, tipo: ${file.type})`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'audio/mp3';

    const transcriptionData = await processAudioWithGemini(
      buffer,
      mimeType,
      customApiKey,
      modelHeader
    );

    return NextResponse.json({
      success: true,
      data: transcriptionData,
    });
  } catch (error: any) {
    console.error('[Transcribe API Error]:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro interno ao processar o áudio com a inteligência artificial.',
      },
      { status: 500 }
    );
  }
}
