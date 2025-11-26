# 🔧 Como Atualizar Front-Adalink para Passar AccessToken

## 📍 Localização no Front-Adalink

Você precisa encontrar onde o token SSO é criado. Baseado na estrutura típica, procure em:

```
C:\Users\lucas-dev\Documents\projects\front-adalink\src\
```

Possíveis arquivos:

- `lib/sso/create-token.ts`
- `app/api/auth/sso/create-token.ts`
- Callback do NextAuth que redireciona para o chat

## 🔍 Como Encontrar

Busque no front-adalink por:

- `SignJWT` (função que cria o token)
- `chat.adalink.ai` (URL de redirecionamento)
- `/api/auth/sso/callback` (endpoint de callback)

## ✏️ Mudança Necessária

### ANTES (código atual):

```typescript
const token = await new SignJWT({
  id: user.id,
  email: user.email,
  name: user.name,
  organizationId: user.organizationId,
  role: user.role,
  phone: user.phone,
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode(secret));
```

### DEPOIS (código atualizado):

```typescript
// 1. Obter o accessToken da sessão do usuário
const session = await getServerSession(); // ou getSession()
const accessToken = session?.accessToken || session?.user?.accessToken;

// 2. Incluir no payload do JWT
const token = await new SignJWT({
  id: user.id,
  email: user.email,
  name: user.name,
  organizationId: user.organizationId,
  role: user.role,
  phone: user.phone,
  accessToken: accessToken, // ← ADICIONAR ESTA LINHA
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode(secret));
```

## 📝 Exemplo Completo

```typescript
// lib/sso/create-token.ts (ou similar)
import { SignJWT } from "jose";
import { getServerSession } from "next-auth";

export async function createSSOTokenForChat(userId: string) {
  // 1. Obter sessão do usuário
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  // 2. Obter accessToken
  // O accessToken pode estar em diferentes lugares:
  const accessToken =
    session.accessToken || // Direto na sessão
    session.user.accessToken || // No objeto user
    (await getAccessTokenFromDB(userId)); // Ou buscar do banco

  if (!accessToken) {
    throw new Error("AccessToken não encontrado");
  }

  // 3. Criar token JWT com accessToken incluído
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET não configurado");
  }

  const token = await new SignJWT({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    organizationId: session.user.organizationId,
    role: session.user.role,
    phone: session.user.phone,
    accessToken: accessToken, // ← IMPORTANTE!
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  return token;
}
```

## 🔑 Onde Está o AccessToken no Front-Adalink?

### Opção 1: Na Sessão NextAuth

Se você usa NextAuth e o accessToken vem de um provider OAuth (Google, etc):

```typescript
// app/api/auth/[...nextauth]/route.ts
export const authOptions = {
  providers: [...],
  callbacks: {
    async jwt({ token, account }) {
      // Quando o usuário faz login, o account tem o access_token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Passar o accessToken para a sessão
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
```

### Opção 2: No Banco de Dados

Se você armazena o accessToken no banco:

```typescript
import { prisma } from "@/lib/prisma"; // ou seu ORM

async function getAccessTokenFromDB(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true },
  });

  return user?.accessToken;
}
```

### Opção 3: De um Token Manager

Se você usa um serviço de tokens:

```typescript
import { tokenManager } from "@/lib/token-manager";

const accessToken = await tokenManager.getAccessToken(userId);
```

## 🧪 Testar a Mudança

### 1. Após fazer a mudança, reinicie o front-adalink

```bash
cd C:\Users\lucas-dev\Documents\projects\front-adalink
npm run dev
# ou
pnpm dev
```

### 2. Faça logout do chat.adalink.ai

### 3. Faça login novamente via SSO

### 4. Copie o token da URL

Durante o redirecionamento, você verá uma URL como:

```
http://localhost:3001/api/auth/sso/callback?token=eyJhbGciOiJIUzI1NiJ9...
```

Copie o token (tudo depois de `token=`)

### 5. Decodifique em https://jwt.io/

Cole o token e verifique se o payload tem:

```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", ← DEVE ESTAR AQUI
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 6. Verifique no Console do Chat

Após login, no console do navegador você deve ver:

```
[Specialists] Sessão completa: {...}
[Specialists] AccessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← Não mais undefined!
```

## ✅ Checklist

- [ ] Encontrar onde o token SSO é criado no front-adalink
- [ ] Identificar onde está o accessToken (sessão, banco, etc)
- [ ] Adicionar `accessToken` ao payload do JWT
- [ ] Reiniciar front-adalink
- [ ] Fazer logout do chat.adalink.ai
- [ ] Fazer login novamente via SSO
- [ ] Verificar token em jwt.io
- [ ] Confirmar que accessToken aparece no console
- [ ] Testar listagem de agentes

## 🆘 Precisa de Ajuda?

Se não conseguir encontrar onde fazer a mudança, me envie:

1. Estrutura de pastas do front-adalink (principalmente `lib/` e `app/api/`)
2. Conteúdo do arquivo que cria o token SSO
3. Como o front-adalink armazena o accessToken

---

**Última atualização:** 2024-11-24
