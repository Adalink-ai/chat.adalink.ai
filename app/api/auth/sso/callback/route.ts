import { type NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';
import { decodeSSOToken } from '@/lib/sso/jwt';
import { syncSSOUser } from '@/lib/sso/sync-user';

/**
 * Endpoint de callback SSO
 * Recebe token JWT do front-adalink, valida, sincroniza usuário e cria sessão
 * 
 * Fluxo:
 * 1. Recebe token via query parameter
 * 2. Decodifica e valida token
 * 3. Sincroniza usuário no banco local
 * 4. Cria sessão NextAuth
 * 5. Redireciona para home
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const redirectTo = searchParams.get('redirect') || '/';

    if (!token) {
      console.error('[SSO] Token não fornecido');
      return NextResponse.redirect(
        new URL('/login?error=sso_token_missing', request.url)
      );
    }

    // Decodificar token
    const ssoData = decodeSSOToken(token);
    if (!ssoData) {
      console.error('[SSO] Token inválido ou expirado');
      return NextResponse.redirect(
        new URL('/login?error=sso_token_invalid', request.url)
      );
    }

    console.log('[SSO] Token válido para:', ssoData.email);
    console.log('[SSO] AccessToken presente no JWT:', !!ssoData.accessToken);
    if (ssoData.accessToken) {
      console.log('[SSO] AccessToken (primeiros 20 chars):', `${ssoData.accessToken.substring(0, 20)}...`);
    } else {
      console.warn('[SSO] ⚠️ AccessToken NÃO foi enviado pelo front-adalink!');
    }

    // Sincronizar usuário no banco local
    const user = await syncSSOUser(ssoData);
    if (!user) {
      console.error('[SSO] Falha ao sincronizar usuário');
      return NextResponse.redirect(
        new URL('/login?error=sso_sync_failed', request.url)
      );
    }

    console.log('[SSO] Usuário sincronizado:', user.email);

    // Criar sessão NextAuth usando provider SSO
    try {
      // Only pass accessToken if it exists and is not empty
      // Passing empty string would be falsy and won't be stored in JWT
      const signInOptions: {
        email: string;
        userId: string;
        redirectTo: string;
        accessToken?: string;
      } = {
        email: user.email,
        userId: user.id,
        redirectTo: redirectTo,
      };
      
      if (ssoData.accessToken) {
        signInOptions.accessToken = ssoData.accessToken;
      }
      
      await signIn('sso', signInOptions);
      
      // Se chegou aqui, signIn redirecionou automaticamente
      // Mas por segurança, vamos garantir o redirect
      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (error: any) {
      // NEXT_REDIRECT é um "erro" esperado que indica sucesso do redirect
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
        console.log('[SSO] Sessão criada com sucesso, redirecionando...');
        // O redirect já foi feito pelo signIn, não precisa fazer nada
        throw error; // Re-throw para que o Next.js processe o redirect
      }
      
      console.error('[SSO] Erro ao criar sessão:', error);
      return NextResponse.redirect(
        new URL('/login?error=sso_session_failed', request.url)
      );
    }
  } catch (error: any) {
    // Se for NEXT_REDIRECT, deixar passar para o Next.js processar
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('[SSO] Erro no callback SSO:', error);
    return NextResponse.redirect(
      new URL('/login?error=sso_error', request.url)
    );
  }
}
