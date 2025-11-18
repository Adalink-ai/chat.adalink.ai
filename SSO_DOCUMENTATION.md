# Documentação SSO - Adalink

## 📋 Visão Geral

Sistema de **Single Sign-On (SSO)** entre **front-adalink** (porta 3000) e **chat-adalink** (porta 3001). Usuários autenticados no front-adalink acessam o chat automaticamente sem novo login.

---

## 🔄 Como Funciona

```
1. Usuário acessa chat-adalink sem autenticação
   ↓
2. Middleware redireciona para front-adalink
   URL: http://localhost:3000/pt/auth/login?callback=http://localhost:3001/
   ↓
3. Usuário faz login (credenciais ou Google)
   ↓
4. Front-adalink cria token JWT (válido por 5 minutos)
   ↓
5. Redireciona para: http://localhost:3001/api/auth/sso/callback?token=...
   ↓
6. Chat-adalink valida token e sincroniza usuário
   ↓
7. ✅ Sessão criada - usuário autenticado!
```

---

## 👥 Gestão de Usuários

### **Bancos de Dados Separados**

Cada aplicação mantém seu próprio banco:

| Aspecto          | Front-Adalink         | Chat-Adalink                  |
| ---------------- | --------------------- | ----------------------------- |
| **ID**           | CUID                  | UUID (gerado pelo PostgreSQL) |
| **Senha**        | Hash armazenado       | `null` (sem senha)            |
| **Autenticação** | Email/senha ou Google | **Apenas via SSO**            |

### **Sincronização Automática**

**Primeira vez que usuário acessa o chat:**

```sql
-- Busca por email
SELECT * FROM users WHERE email = 'user@example.com';

-- Se NÃO existe: cria novo usuário
INSERT INTO users (email, password)
VALUES ('user@example.com', NULL);
-- ID é gerado automaticamente pelo PostgreSQL

-- Se JÁ existe: usa usuário existente
```

**Próximos acessos:**

- Usuário já existe no banco
- Apenas valida token e cria sessão

### **Importante**

- ✅ Usuários SSO são **criados automaticamente** no primeiro acesso
- ✅ Email é usado como **identificador único**
- ✅ Mesmo usuário tem **IDs diferentes** em cada banco
- ⚠️ Usuários SSO **não podem** fazer login direto no chat (sem senha)

---

## ⚙️ Configuração

### **1. Instalar Dependência**

```bash
# Em ambos os projetos
pnpm add jose
```

### **2. Variáveis de Ambiente**

**Front-Adalink (.env)**

```env
NEXTAUTH_SECRET=c788ea7e83e2721421cdd3fe9eea1535
NEXTAUTH_URL=http://localhost:3000
SSO_CHAT_URL=http://localhost:3001
```

**Chat-Adalink (.env)**

```env
AUTH_SECRET=c788ea7e83e2721421cdd3fe9eea1535
NEXTAUTH_SECRET=c788ea7e83e2721421cdd3fe9eea1535
SSO_ENABLED=true
SSO_FRONT_URL=http://localhost:3000
SSO_CHAT_URL=http://localhost:3001
```

⚠️ **IMPORTANTE:** `NEXTAUTH_SECRET` e `AUTH_SECRET` devem ser **idênticos** em ambos os projetos!

---

## 🧪 Teste Local

### **Iniciar Servidores**

```bash
# Terminal 1 - Front-Adalink
cd front-adalink
pnpm dev
# Porta: 3000

# Terminal 2 - Chat-Adalink
cd chat.adalink.ai
pnpm dev
# Porta: 3001
```

### **Testar Fluxo**

1. Acesse `http://localhost:3001`
2. Será redirecionado para login do front-adalink
3. Faça login (credenciais ou Google)
4. Será redirecionado de volta para chat-adalink
5. ✅ Autenticado automaticamente!

### **Logs Esperados**

**Chat-Adalink:**

```
[AUTH] No token found
[AUTH] Redirecting to SSO: http://localhost:3000/pt/auth/login?callback=...
[SSO] Token válido para: user@example.com
[SSO] Usuário já existe: user@example.com  (ou "Criando novo usuário SSO")
[SSO] Sessão criada com sucesso, redirecionando...
```

**Front-Adalink:**

```
[SSO] Criando token para callback: http://localhost:3001/
[SSO API] Creating token for user: user@example.com
[SSO API] Token created successfully
```

---

## 🏗️ Arquitetura Técnica

### **Front-Adalink**

**Arquivos Principais:**

- `src/app/api/auth/sso/create-token/route.ts` - Cria token JWT
- `src/app/[locale]/auth/login/_components/ModernDefaultLogin.tsx` - Detecta callback
- `src/app/[locale]/auth/sso-redirect/page.tsx` - Página intermediária (Google OAuth)
- `src/shared/lib/sso/create-token.ts` - Valida URLs permitidas

**Token JWT:**

```typescript
{
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
  phone: string;
  iat: number; // issued at
  exp: number; // expiration (5 minutos)
}
```

### **Chat-Adalink**

**Arquivos Principais:**

- `middleware.ts` - Intercepta requisições e redireciona para SSO
- `app/api/auth/sso/callback/route.ts` - Recebe token e cria sessão
- `lib/sso/jwt.ts` - Decodifica e valida token
- `lib/sso/sync-user.ts` - Sincroniza usuário no banco
- `app/(auth)/auth.ts` - Provider SSO no NextAuth

---

## 🔐 Segurança

### **Validações Implementadas**

1. **Token JWT:**

   - Assinado com HS256
   - Expira em 5 minutos
   - Validado com secret compartilhado

2. **Callback URL:**

   - Lista branca de domínios permitidos
   - Validação no front e no chat

3. **Sessão:**
   - Gerenciada pelo NextAuth
   - Cookies httpOnly e secure (produção)

### **Domínios Permitidos**

Atualizar em produção:

**`front-adalink/src/shared/lib/sso/create-token.ts`**

```typescript
const allowedDomains = [
  "http://localhost:3001",
  "https://chat.adalink.ai", // Adicionar domínio de produção
];
```

**`front-adalink/src/app/api/auth/sso/create-token/route.ts`**

```typescript
const allowedDomains = [
  "http://localhost:3001",
  "https://chat.adalink.ai", // Adicionar domínio de produção
];
```

---

## 🚀 Deploy em Produção

### **1. Atualizar URLs**

**Front-Adalink (.env.production)**

```env
NEXTAUTH_URL=https://front-adalink.com
SSO_CHAT_URL=https://chat.adalink.ai
```

**Chat-Adalink (.env.production)**

```env
SSO_FRONT_URL=https://front-adalink.com
SSO_CHAT_URL=https://chat.adalink.ai
```

### **2. Gerar Secret Seguro**

```bash
openssl rand -base64 32
```

Use o mesmo secret em ambos os projetos!

### **3. Atualizar Domínios Permitidos**

Adicionar domínios de produção nos arquivos mencionados na seção de segurança.

---

## 🔄 Comportamento de Logout

### **Logout no Chat-Adalink**

- Sessão do chat é destruída
- Próximo acesso redireciona para front-adalink
- Se ainda logado no front: SSO automático ✅
- Se deslogado no front: tela de login

### **Logout no Front-Adalink**

- Sessão do front é destruída
- Sessão do chat **permanece ativa**
- Chat continua acessível até logout manual ou expiração

---

## ✅ Checklist de Implementação

- [x] Biblioteca `jose` instalada
- [x] Secrets compartilhados configurados
- [x] Variáveis de ambiente SSO configuradas
- [x] API de criação de token (front)
- [x] Middleware de redirecionamento (chat)
- [x] API de callback SSO (chat)
- [x] Sincronização de usuários
- [x] Provider SSO no NextAuth
- [x] Validação de URLs
- [x] Tratamento de erros
- [x] Logs de debug

---

## 🐛 Troubleshooting

### **Erro: "Token inválido ou expirado"**

- Verificar se secrets são idênticos
- Token expira em 5 minutos - testar rapidamente

### **Erro: "Callback URL não permitida"**

- Adicionar domínio na lista de permitidos
- Verificar protocolo (http vs https)

### **Erro: "NEXT_REDIRECT"**

- Não é um erro real - é o comportamento esperado
- Indica que redirect foi processado com sucesso

### **Usuário não sincronizado**

- Verificar conexão com banco de dados
- Verificar logs: `[SSO] Criando novo usuário SSO`

---

## 📚 Referências

- [NextAuth.js](https://next-auth.js.org/)
- [Jose JWT Library](https://github.com/panva/jose)

---

**Status:** ✅ Funcional  
**Versão:** 1.0  
**Data:** Novembro 2024
