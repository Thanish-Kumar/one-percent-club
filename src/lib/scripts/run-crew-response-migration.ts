import { readFileSync } from 'fs';
import { join } from 'path';
import { database } from '../database';
import * as dotenv from 'dotenv';

// Load environment variables
// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // This won't override existing variables

async function runCrewResponseMigration() {
  try {
    console.log('Starting crew_responses table migration...');
    
    // Test database connection first
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Could not connect to database');
    }

    // Read SQL migration file
    const migrationPath = join(__dirname, '..', 'migrations', 'create_crew_responses_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Get database pool
    const pool = database.getPool();
    
    // Execute migration
    console.log('Executing crew_responses table migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('crew_responses table has been created.');

    // Close database connection
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await database.close();
    process.exit(1);
  }
}

// Run migration
runCrewResponseMigration();

