import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Database migration script
async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'oneprocentclub',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Run users table migration
    console.log('Reading users table migration...');
    const usersMigrationSQL = readFileSync(
      join(process.cwd(), 'src/lib/migrations/create_users_table.sql'),
      'utf-8'
    );
    
    console.log('Running users table migration...');
    await client.query(usersMigrationSQL);
    console.log('✅ Users table migration completed!');
    
    // Run journal entries table migration
    console.log('\nReading journal entries table migration...');
    const journalMigrationSQL = readFileSync(
      join(process.cwd(), 'src/lib/migrations/create_journal_entries_table.sql'),
      'utf-8'
    );
    
    console.log('Running journal entries table migration...');
    await client.query(journalMigrationSQL);
    console.log('✅ Journal entries table migration completed!');
    
    console.log('\n🎉 All migrations completed successfully!');
    client.release();
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };

