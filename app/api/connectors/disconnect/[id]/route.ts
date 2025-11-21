import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getUserConnectionById,
  deleteConnection,
} from '@/lib/connectors/queries';
import { decryptToken } from '@/lib/connectors/token-encryption';

/**
 * DELETE /api/connectors/disconnect/[id]
 * Disconnects a user's connection to a service
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get connection
    const connection = await getUserConnectionById(id, session.user.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 },
      );
    }

    // Optionally revoke the token at the provider
    // This is best-effort and won't fail the disconnect if revocation fails
    try {
      const accessToken = decryptToken(connection.accessToken);
      // We need to get the provider from the connector
      // For now, we'll skip revocation or implement it after getting connector info
      // await revokeToken(provider, accessToken);
    } catch (error) {
      console.warn('Failed to revoke token:', error);
      // Continue with disconnect even if revocation fails
    }

    // Delete the connection
    const deleted = await deleteConnection(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting connector:', error);

    return NextResponse.json(
      {
        error: 'Failed to disconnect connector',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
