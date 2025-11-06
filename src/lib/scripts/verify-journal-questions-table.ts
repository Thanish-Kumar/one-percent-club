import * as dotenv from 'dotenv';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyTable() {
  console.log('🔍 Verifying journal_questions table...\n');

  try {
    // Test connection
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const client = await database.getClient();

    try {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'journal_questions'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error('❌ Table journal_questions does not exist');
        process.exit(1);
      }

      console.log('✅ Table journal_questions exists\n');

      // Check table structure
      const structureQuery = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'journal_questions'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Table Structure:');
      console.log('─'.repeat(60));
      structureQuery.rows.forEach(row => {
        console.log(`   ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Check indexes
      const indexQuery = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'journal_questions';
      `);

      console.log('\n📑 Indexes:');
      console.log('─'.repeat(60));
      indexQuery.rows.forEach(row => {
        console.log(`   ✓ ${row.indexname}`);
      });

      // Check default template
      const defaultQuery = await client.query(`
        SELECT user_uid, entry_date, 
               jsonb_array_length(questions) as question_count
        FROM journal_questions
        WHERE user_uid = 'default_template';
      `);

      console.log('\n🎯 Default Template:');
      console.log('─'.repeat(60));
      if (defaultQuery.rows.length > 0) {
        const template = defaultQuery.rows[0];
        console.log(`   ✓ User UID: ${template.user_uid}`);
        console.log(`   ✓ Entry Date: ${template.entry_date}`);
        console.log(`   ✓ Question Count: ${template.question_count}`);

        // Show first 3 questions
        const questionsQuery = await client.query(`
          SELECT questions
          FROM journal_questions
          WHERE user_uid = 'default_template';
        `);

        const questions = questionsQuery.rows[0].questions;
        console.log('\n   First 3 questions:');
        questions.slice(0, 3).forEach((q: any, i: number) => {
          console.log(`   ${i + 1}. ${q.question}`);
          console.log(`      Options: ${q.options.join(', ')}`);
        });
        console.log(`   ... and ${questions.length - 3} more questions`);
      } else {
        console.log('   ⚠️  No default template found');
      }

      // Check total rows
      const countQuery = await client.query(`
        SELECT COUNT(*) as total FROM journal_questions;
      `);

      console.log('\n📊 Statistics:');
      console.log('─'.repeat(60));
      console.log(`   Total question sets: ${countQuery.rows[0].total}`);

      console.log('\n' + '='.repeat(60));
      console.log('✅ Table verification complete!\n');

    } finally {
      client.release();
    }

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await database.close();
    process.exit(1);
  }
}

verifyTable();

