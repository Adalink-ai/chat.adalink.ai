# 🔧 Correção Necessária no Front-Adalink

## ❌ Problema Identificado

Verifiquei o código e encontrei o problema:

**Arquivo:** `C:\Users\lucas-dev\Documents\projects\front-adalink\src\shared\lib\sso\create-token.ts`

A função `createSSOToken` **NÃO está incluindo o `accessToken`** no payload do JWT.

## ✅ Correção Necessária

### Arquivo 1: `create-token.ts`

**Localização:** `C:\Users\lucas-dev\Documents\projects\front-adalink\src\shared\lib\sso\create-token.ts`

#### ANTES (linhas 3-11):

```typescript
export interface SSOTokenPayload {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: string;
  phone?: string;
  [key: string]: unknown;
}
```

#### DEPOIS:

```typescript
export interface SSOTokenPayload {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: string;
  phone?: string;
  accessToken?: string; // ← ADICIONAR ESTA LINHA
  [key: string]: unknown;
}
```

### Arquivo 2: Onde `createSSOToken` é chamado

Você precisa encontrar onde essa função é chamada. Provavelmente em:

- `src/app/api/auth/sso/`
- `src/app/api/sso/`
- Ou no callback do NextAuth

**Procure por:** `createSSOToken(`

#### Exemplo de como deve ficar:

**ANTES:**

```typescript
const token = await createSSOToken({
  id: user.id,
  email: user.email,
  name: user.name,
  organizationId: user.organizationId,
  role: user.role,
  phone: user.phone,
});
```

**DEPOIS:**

```typescript
// 1. Obter o accessToken da sessão
const session = await getServerSession(authOptions); // ou getSession()
const accessToken = session?.accessToken || session?.user?.accessToken;

// 2. Incluir no payload
const token = await createSSOToken({
  id: user.id,
  email: user.email,
  name: user.name,
  organizationId: user.organizationId,
  role: user.role,
  phone: user.phone,
  accessToken: accessToken, // ← ADICIONAR ESTA LINHA
});
```

## 🔍 Como Encontrar Onde Fazer a Mudança

### Passo 1: Procurar arquivos que chamam createSSOToken

No front-adalink, procure em:

```
src/app/api/auth/sso/
src/app/api/sso/
src/app/[locale]/auth/sso-redirect/
```

### Passo 2: Procurar por "createSSOToken"

Use o VS Code ou busca global:

- Ctrl+Shift+F (Windows)
- Procure por: `createSSOToken(`

### Passo 3: Identificar onde está o accessToken

O accessToken pode estar em diferentes lugares:

#### Opção A: Na sessão NextAuth

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
const accessToken = session?.accessToken || session?.user?.accessToken;
```

#### Opção B: No banco de dados

```typescript
import { prisma } from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { accessToken: true },
});
const accessToken = user?.accessToken;
```

#### Opção C: De um provider OAuth

Se o front-adalink usa Google OAuth ou similar, o accessToken vem do callback:

```typescript
// No authOptions do NextAuth
callbacks: {
  async jwt({ token, account }) {
    if (account?.access_token) {
      token.accessToken = account.access_token;
    }
    return token;
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken;
    return session;
  },
}
```

## 📝 Exemplo Completo

Aqui está um exemplo completo de como deve ficar:

```typescript
// src/app/api/sso/redirect/route.ts (ou similar)
import { createSSOToken } from "@/shared/lib/sso/create-token";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  // 1. Obter sessão do usuário
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }

  // 2. Obter accessToken
  const accessToken = session.accessToken || session.user.accessToken;

  if (!accessToken) {
    console.error("[SSO] AccessToken não encontrado na sessão");
    return new Response("AccessToken não encontrado", { status: 500 });
  }

  // 3. Criar token SSO com accessToken incluído
  const token = await createSSOToken({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    organizationId: session.user.organizationId,
    role: session.user.role,
    phone: session.user.phone,
    accessToken: accessToken, // ← IMPORTANTE!
  });

  // 4. Redirecionar para chat-adalink com o token
  const callbackUrl = `http://localhost:3001/api/auth/sso/callback?token=${token}`;
  return Response.redirect(callbackUrl);
}
```

## ✅ Checklist de Implementação

- [ ] Adicionar `accessToken?: string` na interface `SSOTokenPayload`
- [ ] Encontrar onde `createSSOToken` é chamado
- [ ] Identificar onde está o `accessToken` no front-adalink
- [ ] Passar o `accessToken` ao chamar `createSSOToken`
- [ ] Testar: fazer logout e login novamente
- [ ] Verificar logs no terminal do chat.adalink.ai
- [ ] Confirmar que `[SSO] AccessToken presente no JWT: true` aparece

## 🧪 Como Testar

Após fazer as mudanças:

1. **Reinicie o front-adalink**
2. **Reinicie o chat.adalink.ai**
3. **Faça logout do chat**
4. **Faça login via SSO**
5. **Observe os logs no terminal do chat:**

```
✅ SUCESSO:
[SSO] Token válido para: user@example.com
[SSO] AccessToken presente no JWT: true
[SSO] AccessToken (primeiros 20 chars): eyJhbGciOiJIUzI1NiI...
[Auth] AccessToken armazenado no JWT ✓
[Auth] AccessToken incluído na sessão ✓
```

6. **Clique em "Agentes" e veja no console do navegador:**

```
✅ SUCESSO:
[Specialists] AccessToken: eyJhbGciOiJIUzI1NiI...
```

## 🆘 Precisa de Ajuda?

Se não conseguir encontrar onde fazer a mudança, me envie:

1. Conteúdo dos arquivos em `src/app/api/sso/`
2. Conteúdo dos arquivos em `src/app/api/auth/sso/`
3. Como o front-adalink armazena o accessToken

---

**Status do Chat.adalink.ai:** ✅ Tudo correto, pronto para receber o accessToken
**Status do Front-adalink:** ❌ Precisa incluir accessToken no JWT SSO
