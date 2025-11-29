import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/connectors/oauth-client';
import {
  getConnectorById,
  createConnection,
  getUserConnection,
  updateConnectionTokens,
} from '@/lib/connectors/queries';
import { encryptToken } from '@/lib/connectors/token-encryption';

/**
 * GET /api/connectors/callback
 * Handles OAuth callback and exchanges code for tokens
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=oauth_${error}`,
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=missing_parameters`,
      );
    }

    // Retrieve and validate state from cookies
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get('oauth_state');

    if (!stateCookie) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=invalid_state`,
      );
    }

    const stateData = JSON.parse(stateCookie.value) as {
      state: string;
      connectorId: string;
      userId: string;
      codeVerifier?: string;
    };

    // Verify state matches
    if (stateData.state !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=state_mismatch`,
      );
    }

    // Clear the state cookie
    cookieStore.delete('oauth_state');

    // Get connector
    const connector = await getConnectorById(stateData.connectorId);

    if (!connector) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=connector_not_found`,
      );
    }

    // Parse OAuth config
    const oauthConfig = connector.oauthConfig as {
      provider: string;
    };

    // Get redirect URI (must match the one used in authorization)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const redirectUri = `${baseUrl}/api/connectors/callback`;

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(
      oauthConfig.provider,
      code,
      redirectUri,
      stateData.codeVerifier,
    );

    // Calculate token expiry
    const tokenExpiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : undefined;

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokenResponse.accessToken);
    const encryptedRefreshToken = tokenResponse.refreshToken
      ? encryptToken(tokenResponse.refreshToken)
      : undefined;

    // Parse scope
    const scopes = tokenResponse.scope ? tokenResponse.scope.split(' ') : [];

    // Check if connection already exists
    const existingConnection = await getUserConnection(
      stateData.userId,
      connector.id,
    );

    if (existingConnection) {
      // Update existing connection
      await updateConnectionTokens(existingConnection.id, {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
      });
    } else {
      // Create new connection
      await createConnection({
        userId: stateData.userId,
        connectorId: connector.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        scopes,
        metadata: {
          tokenType: tokenResponse.tokenType,
        },
      });
    }

    // Redirect back to chat with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?connector_connected=${connector.slug}`,
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}?error=callback_failed`,
    );
  }
}
