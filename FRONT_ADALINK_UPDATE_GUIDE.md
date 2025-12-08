# 🔧 Guia de Atualização do Front-Adalink

Para que a integração de agentes funcione, o front-adalink precisa incluir o `accessToken` no JWT SSO.

## ⚠️ Problema Atual

O erro "Token de acesso não encontrado" indica que o JWT SSO criado pelo front-adalink não está incluindo o `accessToken`.

## ✅ Solução

### 1. Localizar Função de Criação de Token SSO

No front-adalink, localize onde o token SSO é criado. Provavelmente em:

- `lib/sso/create-token.ts`
- Ou no callback de login do NextAuth

### 2. Atualizar Payload do Token

O payload do JWT deve incluir o `accessToken`:

**ANTES:**

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

**DEPOIS:**

```typescript
const token = await new SignJWT({
  id: user.id,
  email: user.email,
  name: user.name,
  organizationId: user.organizationId,
  role: user.role,
  phone: user.phone,
  accessToken: user.accessToken, // ← ADICIONAR ESTA LINHA
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode(secret));
```

### 3. Obter AccessToken do Usuário

O `accessToken` deve vir da sessão do usuário no front-adalink:

```typescript
// Exemplo usando NextAuth
const session = await getSession();
const accessToken = session.user.accessToken;

// Ou se você armazena em outro lugar
const accessToken = await getUserAccessToken(user.id);
```

### 4. Exemplo Completo

```typescript
// lib/sso/create-token.ts
import { SignJWT } from "jose";
import { getSession } from "next-auth/react";

export async function createSSOToken() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET não configurado");
  }

  // Obter accessToken da sessão ou do banco
  const accessToken = session.user.accessToken || session.accessToken;

  if (!accessToken) {
    throw new Error("AccessToken não encontrado");
  }

  const token = await new SignJWT({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    organizationId: session.user.organizationId,
    role: session.user.role,
    phone: session.user.phone,
    accessToken: accessToken, // ← IMPORTANTE
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  return token;
}
```

## 🧪 Testar

### 1. Verificar Token Criado

Após fazer login no front-adalink, copie o token SSO e decodifique em https://jwt.io/

Você deve ver:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // ← Deve estar presente
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2. Verificar no Chat.adalink.ai

Após fazer login via SSO, abra o console do navegador:

```javascript
// Verificar sessão
fetch("/api/auth/session")
  .then((r) => r.json())
  .then((session) => {
    console.log("Sessão:", session);
    console.log("AccessToken:", session.accessToken);
  });
```

Deve mostrar:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // ← Deve estar presente
}
```

## 📝 Checklist

- [ ] Localizar função de criação de token SSO no front-adalink
- [ ] Adicionar `accessToken` ao payload do JWT
- [ ] Obter `accessToken` da sessão do usuário
- [ ] Testar criação do token (decodificar em jwt.io)
- [ ] Fazer login via SSO no chat.adalink.ai
- [ ] Verificar se `session.accessToken` está presente
- [ ] Testar listagem de agentes

## 🐛 Troubleshooting

### AccessToken não está na sessão do front-adalink

Se o front-adalink não armazena o accessToken na sessão NextAuth, você precisa:

1. **Armazenar no callback JWT:**

```typescript
// app/api/auth/[...nextauth]/route.ts
callbacks: {
  async jwt({ token, user, account }) {
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

2. **Ou buscar do banco de dados:**

```typescript
const user = await getUserFromDatabase(session.user.id);
const accessToken = user.accessToken;
```

### Token expira muito rápido

O token SSO expira em 5 minutos por segurança. Se precisar de mais tempo:

```typescript
.setExpirationTime("15m") // 15 minutos
```

Mas lembre-se: quanto maior o tempo, menor a segurança.

## 📚 Referências

- [JWT.io](https://jwt.io/) - Decodificar tokens
- [JOSE Library](https://github.com/panva/jose) - Criar tokens JWT
- [NextAuth Callbacks](https://next-auth.js.org/configuration/callbacks)

---

**Última atualização:** 2024-11-24
