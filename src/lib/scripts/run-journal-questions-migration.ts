import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runJournalQuestionsMigration() {
  console.log('🔄 Running journal questions table migration...\n');

  try {
    // Test connection first
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_journal_questions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Get database client
    const client = await database.getClient();

    try {
      // Execute migration
      await client.query(migrationSQL);
      console.log('✅ Journal questions table created successfully!');
      console.log('   - Table: journal_questions');
      console.log('   - Indexes: question_order, is_active');
      console.log('   - Default: 10 questions inserted');
      console.log('   - JSONB: Flexible answer options\n');
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

runJournalQuestionsMigration();

