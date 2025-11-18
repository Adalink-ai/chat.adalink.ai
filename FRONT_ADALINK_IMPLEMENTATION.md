# Implementação SSO no front-adalink

Este documento descreve as mudanças necessárias no **front-adalink** para completar a integração SSO com o **chat-adalink**.

## ✅ O que já foi implementado no chat-adalink

- ✅ Endpoint `/api/auth/sso/callback` - Recebe token e cria sessão
- ✅ Endpoint `/api/auth/sso/validate` - Valida tokens SSO
- ✅ Middleware atualizado - Redireciona para front-adalink quando não autenticado
- ✅ Sincronização de usuários - Cria/atualiza usuários no banco local
- ✅ Variáveis de ambiente configuradas

## 📋 Mudanças necessárias no front-adalink

### 1. Variáveis de Ambiente

Adicionar ao `.env` do front-adalink:

```env
# SSO Configuration
NEXTAUTH_SECRET=<mesmo_secret_do_chat_adalink>
SSO_CHAT_URL=https://chat.adalink.ai
```

⚠️ **CRÍTICO**: O `NEXTAUTH_SECRET` deve ser **EXATAMENTE O MESMO** nos dois projetos.

### 2. Modificar Callback de Login

Atualizar a lógica de pós-login para suportar redirecionamento SSO.

**Localização**: Arquivo que processa o login (provavelmente em `/app/auth/login` ou similar)

```typescript
// Após login bem-sucedido
export async function POST(request: NextRequest) {
  // ... lógica de login existente ...

  // Após autenticação bem-sucedida
  const session = await getSession(); // ou método equivalente

  // Verificar se há callback URL
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callback");

  if (callbackUrl && callbackUrl.includes("chat.adalink.ai")) {
    // Criar token JWT com dados do usuário
    const token = await createSSOToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      organizationId: session.user.organizationId,
      role: session.user.role,
      phone: session.user.phone,
    });

    // Redirecionar para chat-adalink com token
    const ssoCallbackUrl = `${callbackUrl}/api/auth/sso/callback?token=${token}`;
    return NextResponse.redirect(ssoCallbackUrl);
  }

  // Redirecionamento normal
  return NextResponse.redirect("/dashboard");
}
```

### 3. Criar Função de Geração de Token SSO

Criar arquivo `/lib/sso/create-token.ts`:

```typescript
import { SignJWT } from "jose";

interface SSOTokenPayload {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: string;
  phone?: string;
}

export async function createSSOToken(
  payload: SSOTokenPayload
): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET não configurado");
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m") // Token expira em 5 minutos
    .sign(new TextEncoder().encode(secret));

  return token;
}
```

### 4. Atualizar Página de Login

Modificar a página de login para aceitar o parâmetro `callback`:

```typescript
// app/auth/login/page.tsx
export default function LoginPage({
  searchParams,
}: {
  searchParams: { callback?: string };
}) {
  const callbackUrl = searchParams.callback;

  return (
    <div>
      <h1>Login</h1>
      {callbackUrl && (
        <p className="text-sm text-muted-foreground">
          Você será redirecionado para: {decodeURIComponent(callbackUrl)}
        </p>
      )}
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
```

### 5. Instalar Dependência (se necessário)

Se o projeto não tiver a biblioteca `jose`:

```bash
npm install jose
# ou
pnpm add jose
# ou
yarn add jose
```

## 🔄 Fluxo Completo

```
1. Usuário acessa chat.adalink.ai (sem autenticação)
   ↓
2. Middleware detecta falta de autenticação
   ↓
3. Redireciona para: front-adalink.com/auth/login?callback=https://chat.adalink.ai
   ↓
4. Usuário faz login no front-adalink
   ↓
5. Front-adalink gera token JWT com dados do usuário
   ↓
6. Redireciona para: chat.adalink.ai/api/auth/sso/callback?token=JWT_TOKEN
   ↓
7. Chat-adalink valida token, sincroniza usuário, cria sessão
   ↓
8. Usuário está autenticado no chat-adalink
```

## 🧪 Testes

### Teste 1: Fluxo SSO Completo

1. Limpar cookies do chat-adalink
2. Acessar `https://chat.adalink.ai`
3. Verificar redirecionamento para front-adalink
4. Fazer login no front-adalink
5. Verificar redirecionamento de volta para chat-adalink
6. Confirmar que está autenticado

### Teste 2: Validação de Token

```bash
# Gerar token no front-adalink
curl -X POST https://chat.adalink.ai/api/auth/sso/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "SEU_TOKEN_JWT"}'
```

### Teste 3: Token Expirado

1. Gerar token
2. Aguardar 6 minutos
3. Tentar usar token
4. Verificar erro de token expirado

## 🔒 Segurança

### Checklist de Segurança

- [ ] `NEXTAUTH_SECRET` é forte (32+ caracteres)
- [ ] `NEXTAUTH_SECRET` é o mesmo nos dois projetos
- [ ] HTTPS habilitado em produção
- [ ] Tokens expiram em 5 minutos
- [ ] Validação de domínios nos callbacks
- [ ] Rate limiting nos endpoints SSO
- [ ] Logs de auditoria para tentativas de SSO

### Validação de Domínios

Adicionar validação no front-adalink:

```typescript
const ALLOWED_CALLBACK_DOMAINS = [
  "chat.adalink.ai",
  "localhost:3000", // apenas em desenvolvimento
];

function isValidCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_CALLBACK_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.host === domain
    );
  } catch {
    return false;
  }
}

// Usar antes de redirecionar
if (callbackUrl && isValidCallbackUrl(callbackUrl)) {
  // Prosseguir com SSO
}
```

## 📝 Configuração de Produção

### Vercel / Netlify

1. Adicionar variáveis de ambiente no painel
2. Configurar domínios customizados
3. Habilitar HTTPS (automático)
4. Configurar CORS se necessário

### Docker

```dockerfile
ENV NEXTAUTH_SECRET=<secret_compartilhado>
ENV SSO_CHAT_URL=https://chat.adalink.ai
```

## 🐛 Troubleshooting

### Token Inválido

- Verificar se `NEXTAUTH_SECRET` é o mesmo nos dois projetos
- Verificar se token não expirou (5 minutos)
- Verificar formato do token (deve ter 3 partes separadas por `.`)

### Redirecionamento Infinito

- Verificar se middleware está excluindo `/api/auth/*`
- Verificar se página de login está acessível sem autenticação
- Limpar cookies e tentar novamente

### Usuário Não Sincronizado

- Verificar logs do endpoint `/api/auth/sso/callback`
- Verificar conexão com banco de dados
- Verificar se campos obrigatórios estão presentes no token

## 📚 Referências

- [NextAuth.js JWT](https://next-auth.js.org/configuration/options#jwt)
- [JWT.io](https://jwt.io/) - Debugger de tokens JWT
- [JOSE Library](https://github.com/panva/jose) - Biblioteca JWT para Node.js

## ✅ Checklist de Implementação

- [ ] Variáveis de ambiente configuradas
- [ ] Função `createSSOToken` implementada
- [ ] Callback de login modificado
- [ ] Página de login atualizada
- [ ] Validação de domínios implementada
- [ ] Testes realizados
- [ ] Documentação atualizada
- [ ] Deploy em produção
