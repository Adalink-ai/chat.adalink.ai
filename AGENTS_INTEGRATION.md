# Integração de Agentes/Specialists

Documentação da implementação da listagem de agentes do front-adalink no chat.adalink.ai.

## 📋 Visão Geral

Esta funcionalidade permite que usuários visualizem e acessem os specialists/agentes disponíveis no front-adalink diretamente do sidebar do chat.adalink.ai.

## 🎯 Funcionalidades

### Desktop

- **Nova opção "Agentes"** no menu lateral esquerdo
- Ao clicar, abre um painel lateral com a lista de agentes
- Cada agente mostra:
  - Avatar ou ícone
  - Nome
  - Descrição
  - Categoria (se disponível)
- Ao clicar em um agente, abre em nova aba no front-adalink

### Mobile

- **Botões de alternância** entre "Histórico" e "Agentes"
- Substitui a lista de histórico pela lista de agentes
- Mesmo layout e funcionalidades do desktop

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`hooks/use-specialists.ts`**

   - Hook React para buscar specialists da API do front-adalink
   - Usa a sessão SSO compartilhada (cookies)
   - Retorna: `{ specialists, loading, error }`

2. **`components/sidebar-specialists.tsx`**

   - Componente para renderizar a lista de agentes
   - Mostra loading, erro ou lista de agentes
   - Abre links em nova aba ao clicar

3. **`types/next-auth.d.ts`**
   - Extensão de tipos do NextAuth
   - Define tipos para Session e User

### Arquivos Modificados

1. **`components/app-sidebar.tsx`**

   - Adicionado item "Agentes" no `navigationItems`
   - Implementado botões mobile para alternar entre histórico e agentes
   - Adicionado painel desktop para agentes

2. **`.env.example`**
   - Adicionada variável `NEXT_PUBLIC_FRONT_ADALINK_URL`

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# URL da API do backend (mesma usada no front-adalink)
NEXT_PUBLIC_API_URL=http://localhost:3333
```

**Produção:**

```env
NEXT_PUBLIC_API_URL=https://api.adalink.com
```

### 2. API do Backend

A API do backend deve ter um endpoint:

```
GET /specialists
```

Com autenticação via Bearer token.

**Resposta esperada:**

```json
{
  "specialists": [
    {
      "id": "specialist-1",
      "name": "Assistente de Vendas",
      "description": "Ajuda com processos de vendas",
      "avatar": "https://...",
      "category": "Vendas",
      "isActive": true
    }
  ]
}
```

Ou simplesmente um array:

```json
[
  {
    "id": "specialist-1",
    "name": "Assistente de Vendas",
    ...
  }
]
```

### 3. Autenticação

A requisição usa **Bearer token** obtido via SSO:

- O accessToken é armazenado na sessão durante o login SSO
- A requisição é feita com `Authorization: Bearer {accessToken}`
- O backend valida o token e retorna os specialists

## 🔄 Fluxo de Funcionamento

```
1. Usuário faz login via SSO
   ↓
2. AccessToken é armazenado na sessão NextAuth
   ↓
3. Usuário clica em "Agentes" no sidebar
   ↓
4. Hook useSpecialists busca accessToken da sessão
   ↓
5. Faz GET para backend/specialists com Bearer token
   ↓
6. Backend valida token e retorna lista de specialists
   ↓
7. Lista é renderizada no sidebar
   ↓
8. Ao clicar em um agente, abre em nova aba:
   front-adalink.com/specialists/{id}
```

## 🎨 Interface

### Desktop

```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  [+] Nova Conversa                  │
│                                     │
│  [🏠] Início                        │
│  [🤖] Agentes         ◄─ NOVO       │
│  [🧭] Descobrir                     │
│  [📊] Espaços                       │
│  [📈] Finanças                      │
│                                     │
│  [🌙] Tema                          │
│  [👤] Avatar                        │
└─────────────────────────────────────┘
```

Ao clicar em "Agentes", abre painel lateral:

```
┌────────────────────────────────┐
│  Agentes                       │
├────────────────────────────────┤
│  Agentes disponíveis (3)       │
│                                │
│  ┌──────────────────────────┐ │
│  │ [🤖] Assistente Vendas   │ │
│  │ Ajuda com vendas         │ │
│  │ [Vendas]                 │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │ [🤖] Suporte Técnico     │ │
│  │ Resolve problemas        │ │
│  │ [Suporte]                │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

### Mobile

```
┌──────────────────────────────────┐
│  [☰]  Chat Adalink      [+] [⋮] │ ← Header fixo
├──────────────────────────────────┤
│  [Histórico] [Agentes]           │ ← Botões alternância
├──────────────────────────────────┤
│                                  │
│  Lista de Agentes ou Histórico   │
│                                  │
└──────────────────────────────────┘
```

## 🧪 Testando

### 1. Desenvolvimento Local

```bash
# Terminal 1 - Front-adalink (porta 3001)
cd front-adalink
npm run dev

# Terminal 2 - Chat-adalink (porta 3000)
cd chat.adalink.ai
npm run dev
```

### 2. Verificar Configuração

1. Acesse `http://localhost:3000`
2. Faça login via SSO
3. Clique em "Agentes" no sidebar
4. Deve aparecer a lista de agentes

### 3. Debug

Abra o console do navegador e verifique:

```javascript
// Verificar se a variável de ambiente está correta
console.log(process.env.NEXT_PUBLIC_FRONT_ADALINK_URL);

// Verificar requisição
// Network tab → Filtrar por "specialists"
```

## 🐛 Troubleshooting

### Erro: "Falha ao buscar agentes"

**Possíveis causas:**

1. Front-adalink não está rodando
2. URL incorreta no `.env`
3. Endpoint `/api/specialists` não existe
4. CORS bloqueando requisição

**Solução:**

```bash
# Verificar se front-adalink está rodando
curl http://localhost:3001/api/specialists

# Verificar variável de ambiente
echo $NEXT_PUBLIC_FRONT_ADALINK_URL
```

### Lista vazia

**Possíveis causas:**

1. Não há specialists cadastrados
2. API retornando formato incorreto
3. Usuário não tem permissão

**Solução:**

- Verificar resposta da API no Network tab
- Conferir se há specialists no banco de dados

### Cookies não sendo enviados

**Possíveis causas:**

1. Domínios diferentes (localhost vs 127.0.0.1)
2. CORS não configurado corretamente
3. `NEXTAUTH_SECRET` diferente entre projetos

**Solução:**

```env
# Usar sempre localhost ou sempre 127.0.0.1
NEXT_PUBLIC_FRONT_ADALINK_URL=http://localhost:3001

# Verificar se NEXTAUTH_SECRET é igual nos dois .env
```

## 🔒 Segurança

### Considerações

1. **Cookies compartilhados**: Ambos os projetos devem estar no mesmo domínio em produção
2. **CORS**: Configurar corretamente no front-adalink
3. **Validação**: Front-adalink deve validar sessão antes de retornar specialists
4. **Rate limiting**: Implementar no endpoint de specialists

### Produção

Em produção, use subdomínios:

```
chat.adalink.ai
front.adalink.ai
```

Isso permite compartilhar cookies no domínio `.adalink.ai`.

## 📚 Referências

- [SSO Documentation](./SSO_DOCUMENTATION.md)
- [Front-adalink Implementation](./FRONT_ADALINK_IMPLEMENTATION.md)
- [NextAuth.js Docs](https://next-auth.js.org/)

## ✅ Checklist de Deploy

- [ ] Variável `NEXT_PUBLIC_FRONT_ADALINK_URL` configurada
- [ ] Endpoint `/api/specialists` funcionando no front-adalink
- [ ] `NEXTAUTH_SECRET` igual nos dois projetos
- [ ] CORS configurado no front-adalink
- [ ] Testado em desktop
- [ ] Testado em mobile
- [ ] Links abrindo corretamente em nova aba
- [ ] Loading e estados de erro funcionando

---

**Criado em:** 2024-11-24
**Versão:** 1.0.0
