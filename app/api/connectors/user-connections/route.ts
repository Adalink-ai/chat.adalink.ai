import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserConnectionsWithConnectors } from '@/lib/connectors/queries';

/**
 * GET /api/connectors/user-connections
 * Returns user's connected services
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user connections with connector details
    const userConnections = await getUserConnectionsWithConnectors(
      session.user.id,
    );

    // Map to response format (exclude sensitive token data)
    const connections = userConnections.map((uc) => ({
      id: uc.connection.id,
      connectorId: uc.connector.id,
      connectorName: uc.connector.name,
      connectorSlug: uc.connector.slug,
      connectorIconUrl: uc.connector.iconUrl,
      connectedAt: uc.connection.createdAt,
      updatedAt: uc.connection.updatedAt,
      scopes: uc.connection.scopes,
      metadata: uc.connection.metadata,
      isActive: uc.connection.isActive,
      expiresAt: uc.connection.tokenExpiresAt,
    }));

    return NextResponse.json({
      connections,
    });
  } catch (error) {
    console.error('Error fetching user connections:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch user connections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
