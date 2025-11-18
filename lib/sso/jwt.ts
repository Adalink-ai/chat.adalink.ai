export interface SSOTokenPayload {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: string;
  phone?: string;
  exp?: number;
}

/**
 * Decodifica um token JWT sem validação de assinatura
 * IMPORTANTE: Esta função apenas decodifica. A validação real acontece
 * através do NextAuth quando criamos a sessão
 */
export function decodeSSOToken(token: string): SSOTokenPayload | null {
  try {
    // JWT tem 3 partes separadas por ponto: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[SSO] Token JWT inválido: formato incorreto');
      return null;
    }

    // Decodificar o payload (segunda parte)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    // Validar campos obrigatórios
    if (!payload.id || !payload.email) {
      console.error('[SSO] Token inválido: faltam campos obrigatórios');
      return null;
    }

    // Verificar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('[SSO] Token expirado');
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      organizationId: payload.organizationId as string | undefined,
      role: payload.role as string | undefined,
      phone: payload.phone as string | undefined,
      exp: payload.exp as number | undefined,
    };
  } catch (error) {
    console.error('[SSO] Erro ao decodificar token:', error);
    return null;
  }
}
