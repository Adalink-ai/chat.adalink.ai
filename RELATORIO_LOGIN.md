# Relatório do Sistema de Login - Chat.AdaLink.AI

## Visão Geral

Este documento descreve o processo completo de autenticação da plataforma Chat.AdaLink.AI, uma aplicação Next.js que utiliza NextAuth.js para gerenciamento de sessões e autenticação de usuários.

## Stack de Autenticação

### Biblioteca Principal
- **NextAuth.js**: Framework de autenticação para Next.js
- **bcrypt-ts**: Hashing de senhas
- **PostgreSQL**: Banco de dados principal
- **JWT Tokens**: Gerenciamento de sessões

### Configuração
- **Config Principal**: `/app/(auth)/auth.config.ts`
- **Setup Completo**: `/app/(auth)/auth.ts`
- **API Route**: `/app/api/auth/[...nextauth]/route.ts`

## Métodos de Autenticação

### 1. Google OAuth
- **Provider**: Google OAuth 2.0
- **Variáveis de Ambiente**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Fluxo**: Redirect para Google → Autenticação → Redirect com token

### 2. Email/Senha (Credentials)
- **Provider**: Credentials provider customizado
- **Hashing**: bcrypt-ts para armazenamento seguro
- **Validação**: Comparação de hash no login

### 3. Usuários Convidados (Guest)
- **Provider**: Credentials especial com id: 'guest'
- **Formato**: `guest-{timestamp}` para email
- **Temporário**: Usuários temporários com acesso limitado

## Banco de Dados

### Schema PostgreSQL
```sql
-- Tabela de Usuários
User:
- id: UUID (chave primária)
- email: VARCHAR(64) (não nulo, único)
- password: VARCHAR(64) (nulo para OAuth/convidados)
```

### Funções de Database
- **`getUser(email)`**: Busca usuário por email
- **`createUser(email, password)`**: Cria novo usuário com senha hasheada
- **`createGuestUser()`**: Cria usuário convidado temporário

## Fluxo de Login UI

### Página Principal
- **Localização**: `/app/(auth)/login/page.tsx`
- **Componente**: `DefaultLogin`

### Processo em Dois Passos
1. **Passo 1 - Email**: 
   - Input de email
   - Opção de login social (Google)
   - Validação de formato

2. **Passo 2 - Senha**:
   - Input de senha
   - Validação de credenciais
   - Botão de submit

### Componentes UI
- **EmailStep**: Componente para input de email
- **PasswordStep**: Componente para input de senha
- **SocialLoginBlock**: Integração com Google OAuth
- **LoginFooter**: Links e informações adicionais

## Middleware e Proteção de Rotas

### Middleware Config
- **Arquivo**: `/middleware.ts`
- **Proteção**: Todas as rotas exceto `/login`, `/register`, `/api/auth/*`

### Validações
- **Token Validation**: Usa `getToken` do next-auth/jwt
- **Guest Detection**: Regex `/^guest-\d+$/` para identificar emails de convidados
- **Forced Auth**: Bloqueia completamente acesso de convidados

### Cache de Sessão
- **Arquivo**: `/lib/cache/session-cache.ts`
- **Tipo**: Cache em memória
- **TTL**: 5 minutos padrão
- **Keys**: Contagem de mensagens, sessões de usuário, info de chat

## API Endpoints

### Autenticação
- **POST/GET `/api/auth/[...nextauth]`**: Handle todas as rotas do NextAuth
- **Callbacks**: Sign-in, JWT, session customization

### Endpoints Protegidos
- **`/api/chat`**: Requer autenticação válida
- **`/api/history`**: Gerenciamento de histórico
- **`/api/suggestions`**: Sugestões personalizadas

## Segurança

### Implementações
1. **Password Hashing**: bcrypt-ts com salt
2. **JWT Tokens**: Assinados com `AUTH_SECRET`
3. **Environment Variables**: Dados sensíveis em variáveis de ambiente
4. **Route Protection**: Middleware em nível de rota
5. **Guest Restrictions**: Bloqueio total de usuários convidados

### Variáveis de Ambiente Necessárias
```env
AUTH_SECRET=secret_key_here
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
POSTGRES_URL=database_connection_string
```

## Fluxo Completo de Autenticação

### 1. Acesso Inicial
```
Usuário acessa rota protegida
↓
Middleware verifica token JWT
↓
Sem token → Redirect para /login
```

### 2. Processo de Login
```
Usuário na página de login
↓
Opção 1: Google OAuth
Opção 2: Email/Senha
Opção 3: Guest (bloqueado)
↓
Validação de credenciais
↓
Criação de JWT token
↓
Redirect para / (chat)
```

### 3. Sessão Ativa
```
JWT armazenado em cookies
↓
Middleware valida token em cada requisição
↓
Acesso permitido às rotas protegidas
↓
Cache de sessão para performance
```

## Estado Atual da Configuração

### Importante
O sistema está configurado para **forçar autenticação real**:
- Funcionalidade de guest users existe no código
- **Middleware bloqueia completamente acesso de convidados**
- Apenas usuários autenticados via Google ou email/senha podem acessar

### Conclusão
A plataforma implementa um sistema robusto de autenticação com múltiplos providers, segurança em múltiplas camadas e proteção completa de rotas, garantindo que apenas usuários autenticados tenham acesso às funcionalidades do chat.