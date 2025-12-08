# ✅ Como Verificar se o AccessToken Está Sendo Passado

## 🔍 Logs Adicionados

Adicionei logs detalhados para rastrear o accessToken em cada etapa:

### 1. No Callback SSO (`/api/auth/sso/callback`)

```
[SSO] Token válido para: user@example.com
[SSO] AccessToken presente no JWT: true/false
[SSO] AccessToken (primeiros 20 chars): eyJhbGciOiJIUzI1NiI...
```

**OU**

```
[SSO] ⚠️ AccessToken NÃO foi enviado pelo front-adalink!
```

### 2. No Callback JWT (auth.ts)

```
[Auth] AccessToken armazenado no JWT ✓
```

**OU**

```
[Auth] ⚠️ User não tem accessToken
```

### 3. No Callback Session (auth.ts)

```
[Auth] AccessToken incluído na sessão ✓
```

**OU**

```
[Auth] ⚠️ Token JWT não tem accessToken
```

### 4. No Hook useSpecialists

```
[Specialists] Sessão completa: {...}
[Specialists] AccessToken: eyJhbGciOiJIUzI1NiI...
```

**OU**

```
[Specialists] AccessToken: undefined
[Specialists] Token não encontrado na sessão
```

## 📝 Passo a Passo para Testar

### 1. Reinicie o Chat.adalink.ai

Pressione `Ctrl+C` no terminal e rode novamente:

```bash
pnpm dev --port 3001
```

### 2. Faça Logout

Acesse: http://localhost:3001 e faça logout

### 3. Faça Login via SSO

Clique em "Login via SSO" e faça login pelo front-adalink

### 4. Observe os Logs no Terminal

Você deve ver uma sequência como esta:

**✅ SUCESSO (accessToken está sendo passado):**

```
[SSO] Token válido para: adalink-user-superadmin@adalink.ai
[SSO] AccessToken presente no JWT: true
[SSO] AccessToken (primeiros 20 chars): eyJhbGciOiJIUzI1NiI...
[SSO] Usuário sincronizado: adalink-user-superadmin@adalink.ai
[Auth] AccessToken armazenado no JWT ✓
[Auth] AccessToken incluído na sessão ✓
[SSO] Sessão criada com sucesso, redirecionando...
```

**❌ FALHA (accessToken NÃO está sendo passado):**

```
[SSO] Token válido para: adalink-user-superadmin@adalink.ai
[SSO] AccessToken presente no JWT: false
[SSO] ⚠️ AccessToken NÃO foi enviado pelo front-adalink!
[SSO] Usuário sincronizado: adalink-user-superadmin@adalink.ai
[Auth] ⚠️ User não tem accessToken
[Auth] ⚠️ Token JWT não tem accessToken
[SSO] Sessão criada com sucesso, redirecionando...
```

### 5. Observe os Logs no Console do Navegador (F12)

Abra o console e clique em "Agentes" no sidebar:

**✅ SUCESSO:**

```
[Specialists] Sessão completa: {user: {...}, accessToken: "eyJ..."}
[Specialists] AccessToken: eyJhbGciOiJIUzI1NiI...
```

**❌ FALHA:**

```
[Specialists] Sessão completa: {user: {...}}
[Specialists] AccessToken: undefined
[Specialists] Token não encontrado na sessão
```

## 🎯 Interpretação dos Resultados

### Cenário 1: Todos os ✓ aparecem

**Status:** ✅ FUNCIONANDO PERFEITAMENTE

O front-adalink está passando o accessToken corretamente!

### Cenário 2: ⚠️ aparece no primeiro log SSO

**Status:** ❌ PROBLEMA NO FRONT-ADALINK

O front-adalink **NÃO está incluindo** o accessToken no JWT SSO.

**Solução:** Verifique o código do front-adalink conforme o guia `COMO_ATUALIZAR_FRONT_ADALINK.md`

### Cenário 3: ✓ no SSO mas ⚠️ no Auth

**Status:** ❌ PROBLEMA NO CHAT.ADALINK.AI

O accessToken está chegando, mas não está sendo armazenado corretamente.

**Solução:** Verifique o provider SSO em `auth.ts` (linha 78-104)

## 🐛 Troubleshooting

### Não vejo nenhum log

**Causa:** O servidor não foi reiniciado após as mudanças

**Solução:**

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
pnpm dev --port 3001
```

### Logs aparecem mas accessToken ainda undefined

**Causa:** Você ainda está usando uma sessão antiga

**Solução:**

1. Faça logout
2. Limpe os cookies (F12 → Application → Cookies → Clear all)
3. Faça login novamente

### AccessToken presente: false

**Causa:** Front-adalink não está incluindo o accessToken no JWT

**Solução:** Siga o guia `COMO_ATUALIZAR_FRONT_ADALINK.md`

## 📊 Exemplo de Log Completo (Sucesso)

```
Terminal do Chat.adalink.ai:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SSO] Token válido para: adalink-user-superadmin@adalink.ai
[SSO] AccessToken presente no JWT: true
[SSO] AccessToken (primeiros 20 chars): eyJhbGciOiJIUzI1NiI...
[SSO] Usuário sincronizado: adalink-user-superadmin@adalink.ai
[Auth] AccessToken armazenado no JWT ✓
[Auth] AccessToken incluído na sessão ✓
[SSO] Sessão criada com sucesso, redirecionando...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Console do Navegador:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Specialists] Sessão completa: {
  user: {
    id: "9dce750e-0920-4572-a4a6-ddcbb5c65b35",
    email: "adalink-user-superadmin@adalink.ai",
    type: "regular"
  },
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expires: "2025-12-24T18:46:48.903Z"
}
[Specialists] AccessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Última atualização:** 2024-11-24
