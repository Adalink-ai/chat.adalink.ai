/**
 * OAuth2 Provider Configurations
 * Each provider configuration includes the OAuth endpoints, scopes, and settings
 */

export interface OAuthProvider {
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  responseType: 'code';
  grantType: 'authorization_code';
  usePKCE?: boolean;
}

/**
 * Get OAuth provider configuration
 */
export function getOAuthProvider(provider: string): OAuthProvider {
  const providers: Record<string, OAuthProvider> = {
    google: {
      name: 'Google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      scopes: ['openid', 'email', 'profile'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: true,
    },

    microsoft: {
      name: 'Microsoft',
      authorizationUrl:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      revokeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: true,
    },

    github: {
      name: 'GitHub',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      revokeUrl: 'https://api.github.com/applications/:client_id/token',
      scopes: ['read:user', 'user:email'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },

    dropbox: {
      name: 'Dropbox',
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      revokeUrl: 'https://api.dropboxapi.com/2/auth/token/revoke',
      scopes: [],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: true,
    },

    box: {
      name: 'Box',
      authorizationUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      revokeUrl: 'https://api.box.com/oauth2/revoke',
      scopes: [],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },

    slack: {
      name: 'Slack',
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      revokeUrl: 'https://slack.com/api/auth.revoke',
      scopes: ['users:read', 'users:read.email'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },

    notion: {
      name: 'Notion',
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: [],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },

    linear: {
      name: 'Linear',
      authorizationUrl: 'https://linear.app/oauth/authorize',
      tokenUrl: 'https://api.linear.app/oauth/token',
      revokeUrl: 'https://api.linear.app/oauth/revoke',
      scopes: ['read'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },

    hubspot: {
      name: 'HubSpot',
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: ['oauth'],
      responseType: 'code',
      grantType: 'authorization_code',
      usePKCE: false,
    },
  };

  const config = providers[provider.toLowerCase()];

  if (!config) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  return config;
}

/**
 * Get client credentials for a provider
 */
export function getClientCredentials(provider: string): {
  clientId: string;
  clientSecret: string;
} {
  const envPrefix = provider.toUpperCase();
  const clientId = process.env[`${envPrefix}_OAUTH_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_OAUTH_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(
      `OAuth credentials not configured for ${provider}. ` +
        `Please set ${envPrefix}_OAUTH_CLIENT_ID and ${envPrefix}_OAUTH_CLIENT_SECRET environment variables.`,
    );
  }

  return { clientId, clientSecret };
}

/**
 * Get connector-specific scopes
 * Merges provider default scopes with connector-specific ones
 */
export function getConnectorScopes(
  provider: string,
  connectorSlug: string,
): string[] {
  const providerConfig = getOAuthProvider(provider);
  const baseScopes = [...providerConfig.scopes];

  // Connector-specific scopes
  const connectorScopes: Record<string, string[]> = {
    'google-drive': ['https://www.googleapis.com/auth/drive.readonly'],
    gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
    'google-calendar': ['https://www.googleapis.com/auth/calendar.readonly'],
    'google-contacts': ['https://www.googleapis.com/auth/contacts.readonly'],
    'outlook-email': ['https://graph.microsoft.com/Mail.Read'],
    onedrive: ['https://graph.microsoft.com/Files.Read'],
    'outlook-calendar': ['https://graph.microsoft.com/Calendars.Read'],
    teams: ['https://graph.microsoft.com/Team.ReadBasic.All'],
    sharepoint: ['https://graph.microsoft.com/Sites.Read.All'],
    github: ['repo', 'read:user', 'user:email'],
    dropbox: ['files.metadata.read', 'files.content.read'],
    box: ['root_readwrite'],
    slack: ['users:read', 'channels:read', 'chat:write'],
    notion: ['read_content'],
    linear: ['read'],
    hubspot: ['crm.objects.contacts.read', 'crm.objects.companies.read'],
  };

  const additionalScopes = connectorScopes[connectorSlug] || [];

  return [...new Set([...baseScopes, ...additionalScopes])];
}
