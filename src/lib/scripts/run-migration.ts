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
    
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'src/lib/migrations/create_users_table.sql'),
      'utf-8'
    );
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    client.release();
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };

