import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { connector } from '../lib/db/schema';

/**
 * Seed script to populate connectors table
 * Run with: npx tsx scripts/seed-connectors.ts
 */

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const connectorsData = [
  // Google Services
  {
    name: 'Google Drive',
    slug: 'google-drive',
    provider: 'google',
    iconUrl:
      'https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png',
    description: 'Acesse arquivos e documentos do Google Drive',
    isActive: true,
    oauthConfig: {
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },
  },
  {
    name: 'Gmail',
    slug: 'gmail',
    provider: 'google',
    iconUrl:
      'https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png',
    description: 'Acesse e-mails do Gmail',
    isActive: true,
    oauthConfig: {
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },
  },
  {
    name: 'Google Agenda',
    slug: 'google-calendar',
    provider: 'google',
    iconUrl:
      'https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png',
    description: 'Acesse eventos e compromissos do Google Calendar',
    isActive: true,
    oauthConfig: {
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },
  },
  {
    name: 'Contatos do Google',
    slug: 'google-contacts',
    provider: 'google',
    iconUrl:
      'https://www.liveagent.com/app/uploads/2020/11/google-contacts-logo.jpg',
    description: 'Acesse contatos do Google',
    isActive: true,
    oauthConfig: {
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },
  },

  // Microsoft Services
  {
    name: 'E-mail do Outlook',
    slug: 'outlook-email',
    provider: 'microsoft',
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Microsoft_Office_Outlook_%282013%E2%80%932019%29.svg/1200px-Microsoft_Office_Outlook_%282013%E2%80%932019%29.svg.png',
    description: 'Acesse e-mails do Outlook',
    isActive: false,
    oauthConfig: {
      provider: 'microsoft',
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
      ],
    },
  },
  {
    name: 'OneDrive',
    slug: 'onedrive',
    provider: 'microsoft',
    iconUrl:
      'https://sysadmin365.co.za/wp-content/uploads/2022/08/OneDrive-Logo.png',
    description: 'Acesse arquivos do OneDrive',
    isActive: false,
    oauthConfig: {
      provider: 'microsoft',
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Files.Read',
      ],
    },
  },
  {
    name: 'Teams',
    slug: 'teams',
    provider: 'microsoft',
    iconUrl:
      'https://1000logos.net/wp-content/uploads/2021/12/Microsoft-Teams-Logo.png',
    description: 'Acesse informações do Microsoft Teams',
    isActive: false,
    oauthConfig: {
      provider: 'microsoft',
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Team.ReadBasic.All',
      ],
    },
  },
  {
    name: 'Calendário do Outlook',
    slug: 'outlook-calendar',
    provider: 'microsoft',
    iconUrl: 'https://img.icons8.com/color/1200/outlook-calendar.jpg',
    description: 'Acesse compromissos do Outlook Calendar',
    isActive: false,
    oauthConfig: {
      provider: 'microsoft',
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Calendars.Read',
      ],
    },
  },
  {
    name: 'SharePoint',
    slug: 'sharepoint',
    provider: 'microsoft',
    iconUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWwTXuUhrLQNxdSkETztUhZbqJkedqLeftkQ&s',
    description: 'Acesse sites e documentos do SharePoint',
    isActive: false,
    oauthConfig: {
      provider: 'microsoft',
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Sites.Read.All',
      ],
    },
  },

  // Other Services
  {
    name: 'GitHub',
    slug: 'github',
    provider: 'github',
    iconUrl:
      'https://logos-world.net/wp-content/uploads/2020/11/GitHub-Logo.png',
    description: 'Acesse repositórios e código do GitHub',
    isActive: false,
    oauthConfig: {
      provider: 'github',
      scopes: ['repo', 'read:user', 'user:email'],
    },
  },
  {
    name: 'Dropbox',
    slug: 'dropbox',
    provider: 'dropbox',
    iconUrl:
      'https://cdn-icons-png.flaticon.com/512/4138/4138137.pnghttps://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPHqOTArHna3-t187ktiO-PHfSkoNEDxXKIA&shttps://play-lh.googleusercontent.com/kif95mwH33EVmCgo5HEtExiHMEotoOiMDNVfs2fmIb2LLbsfIrOsNmAlt8bq3xZ_Xuk=w600-h300-pc0xffffff-pd',
    description: 'Acesse arquivos do Dropbox',
    isActive: false,
    oauthConfig: {
      provider: 'dropbox',
      scopes: ['files.metadata.read', 'files.content.read'],
    },
  },
  {
    name: 'Box',
    slug: 'box',
    provider: 'box',
    iconUrl:
      'https://static.vecteezy.com/system/resources/previews/017/395/359/non_2x/dropbox-mobile-apps-icon-free-png.png',
    description: 'Acesse arquivos do Box',
    isActive: false,
    oauthConfig: {
      provider: 'box',
      scopes: ['root_readwrite'],
    },
  },
  {
    name: 'Slack',
    slug: 'slack',
    provider: 'slack',
    iconUrl:
      'https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png',
    description: 'Acesse mensagens e canais do Slack',
    isActive: false,
    oauthConfig: {
      provider: 'slack',
      scopes: ['users:read', 'channels:read', 'chat:write', 'users:read.email'],
    },
  },
  {
    name: 'Notion',
    slug: 'notion',
    provider: 'notion',
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    description: 'Acesse páginas e databases do Notion',
    isActive: false,
    oauthConfig: {
      provider: 'notion',
      scopes: ['read_content'],
    },
  },
  {
    name: 'Linear',
    slug: 'linear',
    provider: 'linear',
    iconUrl:
      'https://cdn.jim-nielsen.com/macos/512/linear-2022-03-15.png?rf=1024',
    description: 'Acesse issues e projetos do Linear',
    isActive: false,
    oauthConfig: {
      provider: 'linear',
      scopes: ['read'],
    },
  },
  {
    name: 'HubSpot',
    slug: 'hubspot',
    provider: 'hubspot',
    iconUrl:
      'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
    description: 'Acesse contatos e empresas do HubSpot CRM',
    isActive: false,
    oauthConfig: {
      provider: 'hubspot',
      scopes: [
        'oauth',
        'crm.objects.contacts.read',
        'crm.objects.companies.read',
      ],
    },
  },
];

async function seed() {
  console.log('🌱 Starting connectors seed...');

  try {
    // Insert connectors
    for (const connectorData of connectorsData) {
      console.log(`  Inserting ${connectorData.name}...`);

      await db
        .insert(connector)
        .values(connectorData)
        .onConflictDoUpdate({
          target: connector.slug,
          set: {
            name: connectorData.name,
            iconUrl: connectorData.iconUrl,
            description: connectorData.description,
            isActive: connectorData.isActive,
            oauthConfig: connectorData.oauthConfig,
          },
        });
    }

    console.log(`✅ Successfully seeded ${connectorsData.length} connectors`);
  } catch (error) {
    console.error('❌ Error seeding connectors:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
