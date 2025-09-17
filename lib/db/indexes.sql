-- Performance optimization indexes for chat application
-- Run these queries against your PostgreSQL database

-- Index for message count queries (most critical optimization)
-- Query: getMessageCountByUserId joins Message_v2 with Chat on chatId and filters by userId, createdAt, role
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_v2_chat_user_time"
ON "Message_v2" ("chatId", "createdAt", "role");

-- Index for chat queries by userId (for getChatsByUserId)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_userid_createdat"
ON "Chat" ("userId", "createdAt" DESC);

-- Index for messages by chatId and createdAt (for getMessagesByChatId)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_v2_chatid_createdat"
ON "Message_v2" ("chatId", "createdAt" ASC);

-- Composite index for the specific join query in getMessageCountByUserId
-- This covers the join between Message_v2 and Chat filtering by userId, createdAt, and role
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_userid_for_message_count"
ON "Chat" ("userId")
WHERE "userId" IS NOT NULL;

-- Index for user authentication queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_email"
ON "User" ("email");

-- Index for stream queries by chatId
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stream_chatid"
ON "Stream" ("chatId");

-- Index for vote queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vote_v2_chatid"
ON "Vote_v2" ("chatId");

-- Partial index for user messages only (most common filter in message count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_v2_user_createdat"
ON "Message_v2" ("createdAt", "chatId")
WHERE "role" = 'user';

-- Statistics update to help query planner
ANALYZE "Message_v2";
ANALYZE "Chat";
ANALYZE "User";
ANALYZE "Stream";