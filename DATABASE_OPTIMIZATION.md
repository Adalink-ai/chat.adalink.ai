# Database Optimization Guide

Este guia explica como aplicar otimizações de índices para melhorar drasticamente a performance das queries do chat.

## 🚀 Impacto Esperado

- **Query time**: Redução de ~250ms para ~50ms
- **Message count queries**: 80% mais rápidas
- **Chat retrieval**: Significativamente otimizado
- **Overall response time**: Melhoria adicional de 200-500ms

## 📋 Pré-requisitos

- PostgreSQL database configurado
- Variável `POSTGRES_URL` configurada no `.env`
- Permissões para criar índices no banco

## 🛠️ Como Aplicar os Índices

### Opção 1: Script TypeScript (Recomendado)
```bash
npm run db:optimize
```

### Opção 2: Script Shell (Alternativo)
```bash
npm run db:optimize:shell
```

### Opção 3: Aplicação Manual
```bash
psql $POSTGRES_URL -f lib/db/indexes.sql
```

## 📊 Índices que Serão Criados

### 1. Message Count Optimization
- **Índice**: `idx_message_v2_chat_user_time`
- **Finalidade**: Otimizar consultas de contagem de mensagens
- **Impacto**: Query mais crítica do sistema

### 2. Chat Queries
- **Índice**: `idx_chat_userid_createdat`
- **Finalidade**: Listar chats do usuário ordenados por data

### 3. Message Retrieval
- **Índice**: `idx_message_v2_chatid_createdat`
- **Finalidade**: Buscar mensagens de um chat específico

### 4. User Authentication
- **Índice**: `idx_user_email`
- **Finalidade**: Login/autenticação mais rápida

### 5. Partial Index for User Messages
- **Índice**: `idx_message_v2_user_createdat`
- **Finalidade**: Otimizar filtros específicos de mensagens de usuário

## ⚡ Verificação Pós-Aplicação

Após aplicar os índices, você deve ver nos logs:

**Antes:**
```
[PERF] DB message count query took: 264 ms
[PERF] DB get chat query took: 238 ms
```

**Depois:**
```
[PERF] DB message count query took: 45 ms
[PERF] DB get chat query took: 38 ms
```

## 🔍 Monitoramento

Para verificar se os índices foram criados:

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## 🚨 Troubleshooting

### Error: "POSTGRES_URL not set"
```bash
# Verifique se a variável está configurada
echo $POSTGRES_URL

# Se não estiver, adicione ao .env
echo "POSTGRES_URL=your_database_url_here" >> .env
```

### Error: "relation already exists"
Isso é normal! O script ignora índices que já existem.

### Error: "permission denied"
Certifique-se de que o usuário do banco tem permissões para criar índices:
```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

## 📈 Monitoramento Contínuo

Recomenda-se executar `ANALYZE` periodicamente:
```bash
psql $POSTGRES_URL -c "ANALYZE;"
```

## 🏗️ Arquivos Relacionados

- `/lib/db/indexes.sql` - Definições dos índices
- `/scripts/apply-indexes.ts` - Script TypeScript
- `/scripts/apply-indexes.sh` - Script Shell alternativo
- `/lib/cache/session-cache.ts` - Sistema de cache complementar

---

💡 **Dica**: Execute a otimização durante horários de baixo tráfego para minimizar impacto nos usuários.