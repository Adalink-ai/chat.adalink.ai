# 💻 Exemplos de Código para front-adalink

Exemplos práticos e prontos para uso no front-adalink.

## 📦 Instalação de Dependências

```bash
# Se usar jose para JWT
npm install jose
# ou
pnpm add jose
# ou
yarn add jose
```

## 🔧 Estrutura de Arquivos Sugerida

```
front-adalink/
├── lib/
│   └── sso/
│       └── create-token.ts    # Criar tokens SSO
├── app/
│   └── auth/
│       └── login/
│           └── page.tsx       # Página de login
└── .env
```

## 📝 Código Completo

### 1. Função para Criar Token SSO

**Arquivo**: `lib/sso/create-token.ts`

```typescript
import { SignJWT } from "jose";

export interface SSOTokenPayload {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: string;
  phone?: string;
}

/**
 * Cria um token JWT para SSO com o chat-adalink
 * Token expira em 5 minutos
 */
export async function createSSOToken(
  payload: SSOTokenPayload
): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET não configurado");
  }

  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m") // Token expira em 5 minutos
      .sign(new TextEncoder().encode(secret));

    return token;
  } catch (error) {
    console.error("[SSO] Erro ao criar token:", error);
    throw new Error("Falha ao criar token SSO");
  }
}

/**
 * Valida se uma URL de callback é permitida
 */
export function isValidCallbackUrl(url: string): boolean {
  const ALLOWED_DOMAINS = [
    "chat.adalink.ai",
    "localhost:3000", // Apenas em desenvolvimento
  ];

  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.host === domain
    );
  } catch {
    return false;
  }
}
```

### 2. Modificar Callback de Login (NextAuth v4)

**Arquivo**: `app/api/auth/[...nextauth]/route.ts` ou similar

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createSSOToken, isValidCallbackUrl } from "@/lib/sso/create-token";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Sua lógica de autenticação existente
        // ...
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.organizationId = user.organizationId;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.organizationId = token.organizationId;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Verificar se há callback para SSO
      const urlObj = new URL(url);
      const callbackUrl = urlObj.searchParams.get("callback");

      if (callbackUrl && isValidCallbackUrl(callbackUrl)) {
        // Criar token SSO
        try {
          const session = await getSession(); // Obter sessão atual

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
          return ssoCallbackUrl;
        } catch (error) {
          console.error("[SSO] Erro ao criar token:", error);
          // Fallback para callback sem token
          return callbackUrl;
        }
      }

      // Redirecionamento normal
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. Página de Login com Suporte a Callback

**Arquivo**: `app/auth/login/page.tsx`

```typescript
"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: callbackUrl || "/dashboard",
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      }
    } catch (error) {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", {
      callbackUrl: callbackUrl || "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Login</h2>
          {callbackUrl && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              Você será redirecionado para:{" "}
              <span className="font-medium">
                {decodeURIComponent(callbackUrl)}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            {/* Google Icon SVG */}
          </svg>
          Continuar com Google
        </button>
      </div>
    </div>
  );
}
```

### 4. Alternativa: Server Action (Next.js 14+)

**Arquivo**: `app/auth/login/actions.ts`

```typescript
"use server";

import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { createSSOToken, isValidCallbackUrl } from "@/lib/sso/create-token";
import { auth } from "@/lib/auth"; // Sua configuração NextAuth

export async function loginWithSSO(
  email: string,
  password: string,
  callbackUrl?: string
) {
  try {
    // Autenticar usuário
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Credenciais inválidas" };
    }

    // Se há callback SSO, criar token e redirecionar
    if (callbackUrl && isValidCallbackUrl(callbackUrl)) {
      const session = await auth();

      if (!session?.user) {
        return { error: "Sessão não encontrada" };
      }

      const token = await createSSOToken({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
        phone: session.user.phone,
      });

      const ssoUrl = `${callbackUrl}/api/auth/sso/callback?token=${token}`;
      redirect(ssoUrl);
    }

    // Redirecionamento normal
    redirect("/dashboard");
  } catch (error) {
    console.error("[SSO] Erro no login:", error);
    return { error: "Erro ao fazer login" };
  }
}
```

### 5. Variáveis de Ambiente

**Arquivo**: `.env`

```env
# NextAuth
NEXTAUTH_URL=https://front-adalink.com
NEXTAUTH_SECRET=<secret_compartilhado_com_chat_adalink>

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# SSO Configuration
SSO_CHAT_URL=https://chat.adalink.ai

# Development only
# SSO_CHAT_URL=http://localhost:3000
```

### 6. Teste Manual

**Arquivo**: `scripts/test-sso-token.ts`

```typescript
import { createSSOToken } from "@/lib/sso/create-token";

async function testSSOToken() {
  const payload = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    organizationId: "org-123",
    role: "user",
  };

  try {
    const token = await createSSOToken(payload);
    console.log("Token criado com sucesso:");
    console.log(token);
    console.log("\nURL de teste:");
    console.log(`http://localhost:3000/api/auth/sso/callback?token=${token}`);
  } catch (error) {
    console.error("Erro ao criar token:", error);
  }
}

testSSOToken();
```

Execute com:

```bash
npx tsx scripts/test-sso-token.ts
```

## 🧪 Testes

### Teste de Integração

```typescript
// __tests__/sso/integration.test.ts
import { createSSOToken, isValidCallbackUrl } from "@/lib/sso/create-token";

describe("SSO Integration", () => {
  it("should create valid SSO token", async () => {
    const payload = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    const token = await createSSOToken(payload);
    expect(token).toBeTruthy();
    expect(token.split(".")).toHaveLength(3); // JWT format
  });

  it("should validate callback URLs", () => {
    expect(isValidCallbackUrl("https://chat.adalink.ai")).toBe(true);
    expect(isValidCallbackUrl("https://malicious.com")).toBe(false);
    expect(isValidCallbackUrl("http://localhost:3000")).toBe(true);
  });

  it("should reject invalid callback URLs", () => {
    expect(isValidCallbackUrl("not-a-url")).toBe(false);
    expect(isValidCallbackUrl("")).toBe(false);
  });
});
```

## 🔍 Debugging

### Log de Token Criado

```typescript
// Adicionar no callback de redirect
console.log("[SSO] Creating token for:", {
  userId: session.user.id,
  email: session.user.email,
  callbackUrl,
});

const token = await createSSOToken(payload);

console.log("[SSO] Token created, redirecting to:", ssoCallbackUrl);
```

### Verificar Token no JWT.io

```typescript
// Após criar token
console.log("Decodifique este token em https://jwt.io/");
console.log(token);
```

## 📚 Referências

- [NextAuth.js Callbacks](https://next-auth.js.org/configuration/callbacks)
- [JOSE Library](https://github.com/panva/jose)
- [JWT.io](https://jwt.io/)

## ✅ Checklist de Implementação

- [ ] Instalar dependência `jose`
- [ ] Criar `lib/sso/create-token.ts`
- [ ] Modificar callback de redirect no NextAuth
- [ ] Atualizar página de login
- [ ] Configurar variáveis de ambiente
- [ ] Testar criação de token
- [ ] Testar fluxo completo com chat-adalink
- [ ] Validar segurança (HTTPS, secrets)
- [ ] Adicionar logs de auditoria
- [ ] Documentar para equipe

---

**Última atualização:** 2024-11-18
**Versão:** 1.0.0
