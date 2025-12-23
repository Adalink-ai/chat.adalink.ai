import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { connector, userConnection } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Connector, UserConnection } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Database queries for connectors and user connections
 */

/**
 * Get all connectors (active and inactive)
 */
export async function getConnectors(): Promise<Connector[]> {
  return db.select().from(connector).orderBy(connector.name);
}

/**
 * Get a connector by slug
 */
export async function getConnectorBySlug(
  slug: string,
): Promise<Connector | null> {
  const results = await db
    .select()
    .from(connector)
    .where(and(eq(connector.slug, slug), eq(connector.isActive, true)))
    .limit(1);

  return results[0] || null;
}

/**
 * Get a connector by ID
 */
export async function getConnectorById(id: string): Promise<Connector | null> {
  const results = await db
    .select()
    .from(connector)
    .where(eq(connector.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Get all user connections
 */
export async function getUserConnections(
  userId: string,
): Promise<UserConnection[]> {
  return db
    .select()
    .from(userConnection)
    .where(
      and(eq(userConnection.userId, userId), eq(userConnection.isActive, true)),
    )
    .orderBy(userConnection.createdAt);
}

/**
 * Get user connections with connector details
 */
export async function getUserConnectionsWithConnectors(userId: string): Promise<
  Array<{
    connection: UserConnection;
    connector: Connector;
  }>
> {
  const results = await db
    .select({
      connection: userConnection,
      connector: connector,
    })
    .from(userConnection)
    .innerJoin(connector, eq(userConnection.connectorId, connector.id))
    .where(
      and(eq(userConnection.userId, userId), eq(userConnection.isActive, true)),
    )
    .orderBy(userConnection.createdAt);

  return results;
}

/**
 * Get a specific user connection
 */
export async function getUserConnection(
  userId: string,
  connectorId: string,
): Promise<UserConnection | null> {
  const results = await db
    .select()
    .from(userConnection)
    .where(
      and(
        eq(userConnection.userId, userId),
        eq(userConnection.connectorId, connectorId),
        eq(userConnection.isActive, true),
      ),
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Get a user connection by ID
 */
export async function getUserConnectionById(
  connectionId: string,
  userId: string,
): Promise<UserConnection | null> {
  const results = await db
    .select()
    .from(userConnection)
    .where(
      and(
        eq(userConnection.id, connectionId),
        eq(userConnection.userId, userId),
      ),
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Create a new user connection
 */
export async function createConnection(data: {
  userId: string;
  connectorId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  metadata?: Record<string, unknown>;
}): Promise<UserConnection> {
  const results = await db
    .insert(userConnection)
    .values({
      userId: data.userId,
      connectorId: data.connectorId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      tokenExpiresAt: data.tokenExpiresAt || null,
      scopes: data.scopes || null,
      metadata: data.metadata || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return results[0];
}

/**
 * Update connection tokens
 */
export async function updateConnectionTokens(
  connectionId: string,
  data: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
  },
): Promise<UserConnection> {
  const results = await db
    .update(userConnection)
    .set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      tokenExpiresAt: data.tokenExpiresAt || null,
      updatedAt: new Date(),
    })
    .where(eq(userConnection.id, connectionId))
    .returning();

  return results[0];
}

/**
 * Delete a user connection
 */
export async function deleteConnection(
  connectionId: string,
  userId: string,
): Promise<boolean> {
  const results = await db
    .delete(userConnection)
    .where(
      and(
        eq(userConnection.id, connectionId),
        eq(userConnection.userId, userId),
      ),
    )
    .returning();

  return results.length > 0;
}

/**
 * Deactivate a user connection (soft delete)
 */
export async function deactivateConnection(
  connectionId: string,
  userId: string,
): Promise<boolean> {
  const results = await db
    .update(userConnection)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userConnection.id, connectionId),
        eq(userConnection.userId, userId),
      ),
    )
    .returning();

  return results.length > 0;
}

/**
 * Check if a user has a specific connector connected
 */
export async function isConnectorConnected(
  userId: string,
  connectorSlug: string,
): Promise<boolean> {
  const conn = await getConnectorBySlug(connectorSlug);
  if (!conn) return false;

  const connection = await getUserConnection(userId, conn.id);
  return connection !== null;
}
