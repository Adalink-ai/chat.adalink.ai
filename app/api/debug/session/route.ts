import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

/**
 * Endpoint de debug para verificar sessão
 * Acesse: http://localhost:3001/api/debug/session
 */
export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      session: session,
      hasAccessToken: !!(session as any)?.accessToken,
      accessToken: (session as any)?.accessToken ? 'PRESENTE (ocultado por segurança)' : 'AUSENTE',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
