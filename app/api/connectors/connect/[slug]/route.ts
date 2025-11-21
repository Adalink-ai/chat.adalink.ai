import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getConnectorBySlug } from '@/lib/connectors/queries';
import {
  getAuthorizationUrl,
  generateState,
} from '@/lib/connectors/oauth-client';
import { cookies } from 'next/headers';

/**
 * POST /api/connectors/connect/[slug]
 * Initiates OAuth flow for a connector
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get connector
    const connector = await getConnectorBySlug(slug);

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 },
      );
    }

    // Parse OAuth config
    const oauthConfig = connector.oauthConfig as {
      provider: string;
    };

    // Generate state for CSRF protection
    const state = generateState();

    // Get redirect URI (callback URL)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/connectors/callback`;

    // Generate authorization URL
    const { url, codeVerifier } = getAuthorizationUrl({
      provider: oauthConfig.provider,
      connectorSlug: slug,
      redirectUri,
      state,
    });

    // Store state and code verifier in cookies for verification in callback
    const cookieStore = await cookies();
    const stateData = {
      state,
      connectorId: connector.id,
      userId: session.user.id,
      codeVerifier,
    };

    cookieStore.set('oauth_state', JSON.stringify(stateData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return NextResponse.json({
      authUrl: url,
    });
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);

    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth flow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
