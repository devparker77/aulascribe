import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const customApiKey = request.headers.get('x-gemini-api-key') || undefined;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da API do Gemini não configurada.' },
        { status: 500 }
      );
    }

    const { displayName, mimeType, numBytes } = await request.json();

    if (!mimeType || !numBytes) {
      return NextResponse.json(
        { error: 'Parâmetros de arquivo inválidos.' },
        { status: 400 }
      );
    }

    // Solicita uma sessão de upload direto para a Google Files API
    // Isso ignora o limite de 4.5MB da Vercel permitindo arquivos de até 2GB
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': numBytes.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType || 'audio/mp3',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: {
            display_name: displayName || 'aula_gravacao',
          },
        }),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error('[Upload Session Error]:', errText);
      return NextResponse.json(
        { error: 'Não foi possível iniciar a sessão de upload na Google API.' },
        { status: initRes.status }
      );
    }

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'URL de upload não retornada pelo Google.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadUrl,
    });
  } catch (error: any) {
    console.error('[Upload Session Server Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar sessão de upload direto.' },
      { status: 500 }
    );
  }
}
