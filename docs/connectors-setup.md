# Connectors Setup Guide

This guide will help you configure the OAuth2 Connectors feature step-by-step.

## Prerequisites

- PostgreSQL database configured
- Node.js and npm installed
- Access to create OAuth applications for desired providers

## Setup Steps

### 1. Run Database Migration

```bash
npm run db:migrate
```

This creates the `connectors` and `user_connections` tables.

### 2. Generate Encryption Key

Generate a secure 256-bit encryption key for storing OAuth tokens:

```bash
openssl rand -base64 32
```

Add the output to your `.env` file:

```bash
CONNECTORS_ENCRYPTION_KEY=your_generated_key_here
```

### 3. Create OAuth Applications

For each provider you want to enable, create an OAuth application:

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `https://your-domain.com/api/connectors/callback`
5. Copy Client ID and Client Secret to `.env`:
   ```bash
   OAUTH_GOOGLE_CLIENT_ID=your_client_id
   OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret
   ```

#### Microsoft

1. Go to [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Register a new application
3. Add Web platform with redirect URI: `https://your-domain.com/api/connectors/callback`
4. Create a client secret
5. Add to `.env`:
   ```bash
   OAUTH_MICROSOFT_CLIENT_ID=your_application_id
   OAUTH_MICROSOFT_CLIENT_SECRET=your_client_secret
   ```

#### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Homepage URL: `https://your-domain.com`
4. Authorization callback URL: `https://your-domain.com/api/connectors/callback`
5. Add to `.env`:
   ```bash
   OAUTH_GITHUB_CLIENT_ID=your_client_id
   OAUTH_GITHUB_CLIENT_SECRET=your_client_secret
   ```

#### Other Providers

Follow similar steps for:

- **Dropbox**: https://www.dropbox.com/developers/apps
- **Box**: https://app.box.com/developers/console
- **Slack**: https://api.slack.com/apps
- **Notion**: https://www.notion.so/my-integrations
- **Linear**: https://linear.app/settings/api
- **HubSpot**: https://app.hubspot.com/developer

### 4. Seed Connectors Database

Populate the database with connector definitions:

```bash
npx tsx scripts/seed-connectors.ts
```

This adds all 14 connectors to your database.

### 5. Configure NEXTAUTH_URL

Ensure your `.env` has the correct application URL:

```bash
NEXTAUTH_URL=https://your-domain.com
```

This is used for generating OAuth redirect URIs.

### 6. Verify Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open the chat interface
3. Click the Integrations button (plug icon) at the bottom
4. You should see all 14 connectors displayed
5. Try connecting to a configured provider
6. Verify the OAuth flow completes and status updates to "Conectado"

## Troubleshooting

### "Invalid redirect URI" error

- Ensure the redirect URI in your OAuth app matches exactly: `{YOUR_APP_URL}/api/connectors/callback`
- Check that `NEXTAUTH_URL` is set correctly in `.env`

### "CONNECTORS_ENCRYPTION_KEY environment variable is not set"

- Run `openssl rand -base64 32` and add the output to `.env`
- Restart your application after adding the key

### "Unknown OAuth provider" error

- Verify the provider is configured in `lib/connectors/oauth-providers.ts`
- Check that the connector's `provider` field in the database matches the provider name

### Tokens not refreshing

- Ensure your OAuth app has `offline_access` scope (for Microsoft)
- For Google, verify `access_type=offline` and `prompt=consent` are set
- Check that refresh tokens are being stored in the database

### Connection appears but authentication fails

- Verify OAuth client credentials are correct
- Check that scopes match what's configured in your OAuth app
- Look at network requests in browser DevTools for error details

## Security Checklist

- [ ] Generated strong encryption key (256-bit)
- [ ] All OAuth apps use HTTPS redirect URIs in production
- [ ] Client secrets are not committed to version control
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is in place for API endpoints

## Next Steps

After setup:

1. Test each connector with real OAuth flow
2. Implement connector-specific data retrieval logic
3. Add UI for browsing connected data
4. Set up monitoring for token expiration
5. Document connector capabilities for users

## Environment Variables Reference

```bash
# Required
CONNECTORS_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
NEXTAUTH_URL=https://your-domain.com

# Optional - Configure only providers you want to enable
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

OAUTH_MICROSOFT_CLIENT_ID=
OAUTH_MICROSOFT_CLIENT_SECRET=

OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

OAUTH_DROPBOX_CLIENT_ID=
OAUTH_DROPBOX_CLIENT_SECRET=

OAUTH_BOX_CLIENT_ID=
OAUTH_BOX_CLIENT_SECRET=

OAUTH_SLACK_CLIENT_ID=
OAUTH_SLACK_CLIENT_SECRET=

OAUTH_NOTION_CLIENT_ID=
OAUTH_NOTION_CLIENT_SECRET=

OAUTH_LINEAR_CLIENT_ID=
OAUTH_LINEAR_CLIENT_SECRET=

OAUTH_HUBSPOT_CLIENT_ID=
OAUTH_HUBSPOT_CLIENT_SECRET=
```

## Support

For issues or questions:

- Check the implementation plan at `implementation_plan.md`
- Review the walkthrough at `walkthrough.md`
- Check logs in browser DevTools and server console
