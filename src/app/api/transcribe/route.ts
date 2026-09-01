import { NextRequest, NextResponse } from 'next/server';
import { processAudioWithGemini, processFileUriWithGemini } from '@/lib/gemini';

export const maxDuration = 300; // 5 minutos de timeout
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const customApiKey = request.headers.get('x-gemini-api-key') || undefined;
    const modelHeader = request.headers.get('x-gemini-model') || 'gemini-3.6-flash';
    const contentType = request.headers.get('content-type') || '';

    // Caso 1: Upload direto prévio (JSON com fileUri da Google Files API)
    // Permite arquivos de qualquer tamanho (50MB, 100MB, 500MB+) sem esbarrar no limite de 4.5MB da Vercel
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileUri, fileName, mimeType } = body;

      if (!fileUri) {
        return NextResponse.json(
          { error: 'fileUri não fornecido na requisição.' },
          { status: 400 }
        );
      }

      console.log(`[Transcribe API] Processando via File URI direto do Google: ${fileUri}`);
      const transcriptionData = await processFileUriWithGemini(
        fileUri,
        fileName,
        mimeType || 'audio/mp3',
        customApiKey,
        modelHeader
      );

      return NextResponse.json({
        success: true,
        data: transcriptionData,
      });
    }

    // Caso 2: Multipart FormData tradicional (áudios curtos ou mic)
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio foi enviado. Por favor, selecione uma gravação.' },
        { status: 400 }
      );
    }

    console.log(`[Transcribe API] Recebido FormData: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB, tipo: ${file.type})`);

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
