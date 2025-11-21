import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getConnectors,
  getUserConnectionsWithConnectors,
} from '@/lib/connectors/queries';

/**
 * GET /api/connectors/list
 * Returns list of available connectors with connection status for the user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all connectors
    const connectors = await getConnectors();

    // Get user's connections
    const userConnections = await getUserConnectionsWithConnectors(
      session.user.id,
    );

    // Map connectors with connection status
    const connectorsWithStatus = connectors.map((connector) => {
      const userConnection = userConnections.find(
        (uc) => uc.connector.id === connector.id,
      );

      return {
        id: connector.id,
        name: connector.name,
        slug: connector.slug,
        provider: connector.provider,
        iconUrl: connector.iconUrl,
        description: connector.description,
        isActive: connector.isActive,
        isConnected: !!userConnection,
        connectionId: userConnection?.connection.id,
        connectedAt: userConnection?.connection.createdAt,
        metadata: userConnection?.connection.metadata,
      };
    });

    return NextResponse.json({
      connectors: connectorsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching connectors:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch connectors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
