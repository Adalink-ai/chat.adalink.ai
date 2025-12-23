#!/usr/bin/env tsx

/**
 * Database optimization script
 * Applies performance indexes to improve query speed
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

async function applyIndexes() {
  try {
    console.log('[DB-OPTIMIZE] Starting database optimization...');

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/db/indexes.sql');
    const indexSQL = readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = indexSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[DB-OPTIMIZE] Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[DB-OPTIMIZE] Executing statement ${i + 1}/${statements.length}...`);

      const startTime = Date.now();
      try {
        await client.unsafe(statement);
        console.log(`[DB-OPTIMIZE] ✓ Statement ${i + 1} completed in ${Date.now() - startTime}ms`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`[DB-OPTIMIZE] ⚠ Statement ${i + 1}: Index already exists, skipping`);
        } else {
          console.error(`[DB-OPTIMIZE] ✗ Statement ${i + 1} failed:`, error.message);
        }
      }
    }

    console.log('[DB-OPTIMIZE] Database optimization completed successfully!');

  } catch (error) {
    console.error('[DB-OPTIMIZE] Failed to optimize database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyIndexes();
}

export { applyIndexes };