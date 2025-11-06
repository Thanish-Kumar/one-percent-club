import * as dotenv from 'dotenv';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function migrateQuestionFormat() {
  console.log('🔄 Migrating Journal Questions to New Format\n');
  console.log('='.repeat(60));

  try {
    // Test connection
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const client = await database.getClient();

    try {
      // Get all question sets
      const allSets = await client.query(`
        SELECT id, user_uid, entry_date, questions
        FROM journal_questions
        ORDER BY id;
      `);

      console.log(`\n📊 Found ${allSets.rows.length} question sets to check\n`);

      let migratedCount = 0;
      let alreadyNewFormat = 0;
      let skippedCount = 0;

      for (const row of allSets.rows) {
        const questionsData = row.questions;
        
        // Check if already in new format
        if (questionsData && questionsData.Questions && Array.isArray(questionsData.Questions)) {
          console.log(`✅ ${row.user_uid} @ ${row.entry_date.toISOString().split('T')[0]} - Already new format`);
          alreadyNewFormat++;
          continue;
        }

        // Check if in old format (array)
        if (Array.isArray(questionsData)) {
          console.log(`🔄 Migrating ${row.user_uid} @ ${row.entry_date.toISOString().split('T')[0]}...`);
          
          // Convert old format to new format
          const newFormat = {
            "Questions": questionsData.map((item: any, index: number) => {
              const questionKey = `Question ${index + 1}`;
              return {
                [questionKey]: item.question,
                "Answers": item.options || []
              };
            })
          };

          // Update the row
          await client.query(`
            UPDATE journal_questions
            SET questions = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [JSON.stringify(newFormat), row.id]);

          console.log(`   ✅ Migrated successfully`);
          migratedCount++;
        } else {
          console.log(`⚠️  ${row.user_uid} @ ${row.entry_date.toISOString().split('T')[0]} - Unknown format, skipped`);
          skippedCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('\n📊 Migration Summary:');
      console.log('-'.repeat(60));
      console.log(`   Total question sets:     ${allSets.rows.length}`);
      console.log(`   Already new format:      ${alreadyNewFormat}`);
      console.log(`   Migrated to new format:  ${migratedCount}`);
      console.log(`   Skipped (unknown):       ${skippedCount}`);
      console.log('');

      if (migratedCount > 0) {
        console.log(`✅ Successfully migrated ${migratedCount} question set(s)!\n`);
      } else if (alreadyNewFormat === allSets.rows.length) {
        console.log('✅ All question sets already in new format!\n');
      }

      // Show sample of new format
      if (allSets.rows.length > 0) {
        console.log('📋 Sample of New Format:');
        console.log('-'.repeat(60));
        const sample = await client.query(`
          SELECT questions
          FROM journal_questions
          WHERE user_uid = 'default_template'
          LIMIT 1
        `);

        if (sample.rows.length > 0) {
          const firstQuestion = sample.rows[0].questions.Questions[0];
          const questionKey = Object.keys(firstQuestion).find(k => k.startsWith('Question'));
          if (questionKey) {
            console.log(`   ${questionKey}: ${firstQuestion[questionKey]}`);
            console.log(`   Answers: ${firstQuestion.Answers.join(', ')}`);
          }
        }
      }

    } finally {
      client.release();
    }

    await database.close();
    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await database.close();
    process.exit(1);
  }
}

migrateQuestionFormat();

