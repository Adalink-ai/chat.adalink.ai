#!/usr/bin/env node

/**
 * Apply database indexes for performance optimization
 * This script applies the indexes defined in lib/db/indexes.sql
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables from .env file
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      process.env[key.trim()] = value;
    }
  }

  console.log('✅ Loaded environment variables from .env file');
} else {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Get database URL from environment
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable is not set');
  process.exit(1);
}

async function applyIndexes() {
  const client = postgres(POSTGRES_URL);

  try {
    console.log('🚀 Starting database index optimization...');
    console.log('📍 Database URL:', POSTGRES_URL.split('@')[1] || 'localhost');

    // Read the indexes SQL file
    const sqlPath = join(process.cwd(), 'lib/db/indexes.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Extract CREATE INDEX statements
    const lines = sqlContent.split('\n');
    const indexStatements = [];

    let currentStatement = '';
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }

      currentStatement += line + '\n';

      // If line ends with semicolon, it's the end of a statement
      if (trimmedLine.endsWith(';')) {
        indexStatements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    console.log(`📊 Found ${indexStatements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    // Execute each statement
    for (let i = 0; i < indexStatements.length; i++) {
      const statement = indexStatements[i];
      const statementNum = i + 1;

      // Extract index name for better logging
      const indexMatch = statement.match(/CREATE INDEX[^"]*"([^"]+)"/i);
      const indexName = indexMatch ? indexMatch[1] : `statement ${statementNum}`;

      console.log(`⏳ Applying index ${statementNum}/${indexStatements.length}: ${indexName}`);

      try {
        const startTime = Date.now();
        await client.unsafe(statement);
        const duration = Date.now() - startTime;

        console.log(`✅ Index "${indexName}" created successfully (${duration}ms)`);
        successCount++;
      } catch (error: any) {
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log(`⚠️  Index "${indexName}" already exists, skipping`);
          skipCount++;
        } else {
          console.error(`❌ Failed to create index "${indexName}":`, error.message);
          console.error('   SQL:', statement.substring(0, 100) + '...');
        }
      }

      console.log(''); // Empty line for readability
    }

    // Run ANALYZE to update statistics
    console.log('📈 Updating table statistics...');
    try {
      await client.unsafe('ANALYZE "Message_v2", "Chat", "User", "Stream";');
      console.log('✅ Table statistics updated');
    } catch (error: any) {
      console.error('⚠️  Failed to update statistics:', error.message);
    }

    // Summary
    console.log('\n🎉 Database optimization completed!');
    console.log(`   ✅ Successfully applied: ${successCount} indexes`);
    console.log(`   ⚠️  Skipped (already exist): ${skipCount} indexes`);
    console.log(`   ❌ Failed: ${indexStatements.length - successCount - skipCount} indexes`);

    if (successCount > 0) {
      console.log('\n💡 Performance improvement expected:');
      console.log('   • Query times should reduce from ~250ms to ~50ms');
      console.log('   • Message count queries will be much faster');
      console.log('   • Chat retrieval will be optimized');
    }

  } catch (error: any) {
    console.error('💥 Critical error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
applyIndexes().catch(console.error);