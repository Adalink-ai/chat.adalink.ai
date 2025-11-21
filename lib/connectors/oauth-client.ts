import crypto from 'node:crypto';
import {
  getOAuthProvider,
  getClientCredentials,
  getConnectorScopes,
} from './oauth-providers';

/**
 * OAuth2 Client
 * Handles OAuth2 authorization flow for multiple providers
 */

export interface AuthorizationUrlParams {
  provider: string;
  connectorSlug: string;
  redirectUri: string;
  state: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Generate PKCE code challenge
 */
function generateCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Generate a random PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Build authorization URL for OAuth flow
 */
export function getAuthorizationUrl(params: AuthorizationUrlParams): {
  url: string;
  codeVerifier?: string;
} {
  const { provider, connectorSlug, redirectUri, state } = params;

  const providerConfig = getOAuthProvider(provider);
  const { clientId } = getClientCredentials(provider);
  const scopes = getConnectorScopes(provider, connectorSlug);

  const url = new URL(providerConfig.authorizationUrl);

  // Common OAuth2 parameters
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', providerConfig.responseType);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', scopes.join(' '));

  // Add access_type=offline for Google to get refresh token
  if (provider === 'google') {
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
  }

  // Add PKCE if supported
  let codeVerifier: string | undefined;
  if (providerConfig.usePKCE) {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }

  return {
    url: url.toString(),
    codeVerifier,
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const providerConfig = getOAuthProvider(provider);
  const { clientId, clientSecret } = getClientCredentials(provider);

  const body = new URLSearchParams({
    grant_type: providerConfig.grantType,
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  // Add PKCE code verifier if used
  if (codeVerifier && providerConfig.usePKCE) {
    body.set('code_verifier', codeVerifier);
  }

  try {
    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type || 'Bearer',
    };
  } catch (error) {
    throw new Error(
      `Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  provider: string,
  refreshToken: string,
): Promise<TokenResponse> {
  const providerConfig = getOAuthProvider(provider);
  const { clientId, clientSecret } = getClientCredentials(provider);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type || 'Bearer',
    };
  } catch (error) {
    throw new Error(
      `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Revoke an access token
 */
export async function revokeToken(
  provider: string,
  token: string,
): Promise<void> {
  const providerConfig = getOAuthProvider(provider);

  if (!providerConfig.revokeUrl) {
    console.warn(`Provider ${provider} does not support token revocation`);
    return;
  }

  const { clientId, clientSecret } = getClientCredentials(provider);

  try {
    const response = await fetch(providerConfig.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      console.warn(
        `Token revocation failed for ${provider}: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(
      `Failed to revoke token for ${provider}:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Generate a secure random state parameter for OAuth
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}
