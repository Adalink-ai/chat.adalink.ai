import 'server-only';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, type User } from '@/lib/db/schema';
import type { SSOTokenPayload } from './jwt';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Sincroniza usuário do SSO com o banco local
 * Se o usuário já existe (por email), retorna o existente
 * Se não existe, cria um novo com os dados do SSO
 */
export async function syncSSOUser(ssoData: SSOTokenPayload): Promise<User | null> {
  try {
    // Verificar se usuário já existe por email
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, ssoData.email));

    if (existingUsers.length > 0) {
      console.log('[SSO] Usuário já existe:', ssoData.email);
      return existingUsers[0];
    }

    // Criar novo usuário SSO (sem senha, pois autenticação é via SSO)
    // Não especificar ID - deixar o banco gerar um novo UUID
    console.log('[SSO] Criando novo usuário SSO:', ssoData.email);
    const newUsers = await db
      .insert(user)
      .values({
        email: ssoData.email,
        password: null, // Usuários SSO não têm senha local
      })
      .returning();

    if (newUsers.length === 0) {
      console.error('[SSO] Falha ao criar usuário');
      return null;
    }

    return newUsers[0];
  } catch (error) {
    console.error('[SSO] Erro ao sincronizar usuário:', error);
    return null;
  }
}
