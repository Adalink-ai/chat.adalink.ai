import { type NextRequest, NextResponse } from 'next/server';
import { decodeSSOToken } from '@/lib/sso/jwt';

/**
 * Endpoint de validação SSO
 * Valida token JWT do front-adalink sem criar sessão
 * Útil para verificar se um token é válido antes de usá-lo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Decodificar e validar token
    const ssoData = decodeSSOToken(token);
    
    if (!ssoData) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Retornar dados básicos do usuário (sem informações sensíveis)
    return NextResponse.json({
      valid: true,
      user: {
        id: ssoData.id,
        email: ssoData.email,
        name: ssoData.name,
      },
    });
  } catch (error) {
    console.error('[SSO] Erro ao validar token:', error);
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para validação via query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Decodificar e validar token
    const ssoData = decodeSSOToken(token);
    
    if (!ssoData) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Retornar dados básicos do usuário
    return NextResponse.json({
      valid: true,
      user: {
        id: ssoData.id,
        email: ssoData.email,
        name: ssoData.name,
      },
    });
  } catch (error) {
    console.error('[SSO] Erro ao validar token:', error);
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
}
