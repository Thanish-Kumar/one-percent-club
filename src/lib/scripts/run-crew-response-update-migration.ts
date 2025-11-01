import { readFileSync } from 'fs';
import { join } from 'path';
import { database } from '../database';
import * as dotenv from 'dotenv';

// Load environment variables
// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // This won't override existing variables

async function runCrewResponseUpdateMigration() {
  try {
    console.log('Starting crew_responses table update migration...');
    console.log('This will add updated_at column and enforce one entry per user per day.\n');
    
    // Test database connection first
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Could not connect to database');
    }

    // Read SQL migration file
    const migrationPath = join(__dirname, '..', 'migrations', 'update_crew_responses_unique_per_day.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Get database pool
    const pool = database.getPool();
    
    // Execute migration
    console.log('Executing migration...');
    console.log('- Adding updated_at column');
    console.log('- Creating update trigger');
    console.log('- Removing duplicate entries (keeping most recent per user per day)');
    console.log('- Adding unique constraint (user_uid + date)\n');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nChanges made:');
    console.log('- Added updated_at column to track when entries are modified');
    console.log('- Added unique constraint: one entry per user per day');
    console.log('- Removed any duplicate entries from before this migration\n');

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
runCrewResponseUpdateMigration();

