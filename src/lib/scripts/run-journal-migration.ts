import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runJournalMigration() {
  console.log('🔄 Running journal entries table migration...\n');

  try {
    // Test connection first
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_journal_entries_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Get database client
    const client = await database.getClient();

    try {
      // Execute migration
      await client.query(migrationSQL);
      console.log('✅ Journal entries table created successfully!');
      console.log('   - Table: journal_entries');
      console.log('   - Indexes: user_uid, entry_date, user+date composite');
      console.log('   - Constraints: unique user+date, foreign key to users');
      console.log('   - Triggers: auto-update updated_at\n');
    } finally {
      client.release();
    }

    // Close database connection
    await database.close();
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await database.close();
    process.exit(1);
  }
}

runJournalMigration();

