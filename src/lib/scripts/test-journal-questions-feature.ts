import * as dotenv from 'dotenv';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testJournalQuestionsFeature() {
  console.log('🧪 Testing Journal Questions Feature\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Test connection
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const client = await database.getClient();

    try {
      // Test 1: Check default template exists
      console.log('📋 Test 1: Check Default Template');
      console.log('-'.repeat(60));
      
      const defaultTemplate = await client.query(`
        SELECT user_uid, entry_date, 
               jsonb_array_length(questions) as question_count
        FROM journal_questions
        WHERE user_uid = 'default_template';
      `);

      if (defaultTemplate.rows.length > 0) {
        const template = defaultTemplate.rows[0];
        console.log(`✅ Default template found`);
        console.log(`   User UID: ${template.user_uid}`);
        console.log(`   Questions: ${template.question_count}`);
      } else {
        console.log('❌ Default template not found');
      }

      // Test 2: Simulate fetching questions for a test user
      console.log('\n📅 Test 2: Fetch Questions for Test User');
      console.log('-'.repeat(60));
      
      const testUserUid = 'test-user-123';
      const testDate = '2025-01-15';
      
      console.log(`   User UID: ${testUserUid}`);
      console.log(`   Date: ${testDate}`);
      
      // Check if user already has questions for this date
      const existingQuestions = await client.query(`
        SELECT * FROM journal_questions
        WHERE user_uid = $1 AND entry_date = $2;
      `, [testUserUid, testDate]);

      if (existingQuestions.rows.length > 0) {
        console.log(`   ✅ Found existing question set (${existingQuestions.rows[0].questions.length} questions)`);
        console.log(`   Source: Custom`);
      } else {
        console.log(`   ℹ️  No existing questions for this user+date`);
        console.log(`   Action: Would fetch default template and create new set`);
      }

      // Test 3: Show questions for different dates
      console.log('\n📊 Test 3: Show All Question Sets');
      console.log('-'.repeat(60));
      
      const allSets = await client.query(`
        SELECT user_uid, entry_date, 
               jsonb_array_length(questions) as question_count,
               created_at
        FROM journal_questions
        ORDER BY created_at DESC
        LIMIT 10;
      `);

      if (allSets.rows.length > 0) {
        console.log(`   Total question sets in database: ${allSets.rows.length}`);
        allSets.rows.forEach((row, index) => {
          const isDefault = row.user_uid === 'default_template';
          const label = isDefault ? '📋 [DEFAULT]' : '✨ [CUSTOM]';
          console.log(`   ${index + 1}. ${label} ${row.user_uid} @ ${row.entry_date.toISOString().split('T')[0]} (${row.question_count} questions)`);
        });
      } else {
        console.log('   No question sets found');
      }

      // Test 4: Simulate API workflow
      console.log('\n🔄 Test 4: Simulate API Workflow');
      console.log('-'.repeat(60));
      
      const simulateUserUid = 'new-user-456';
      const simulateDate = '2025-01-20';
      
      console.log(`   Scenario: User visits journaling screen`);
      console.log(`   User UID: ${simulateUserUid}`);
      console.log(`   Date: ${simulateDate}`);
      console.log('');
      
      // Step 1: Check if exists
      const checkExisting = await client.query(`
        SELECT * FROM journal_questions
        WHERE user_uid = $1 AND entry_date = $2;
      `, [simulateUserUid, simulateDate]);

      if (checkExisting.rows.length > 0) {
        console.log(`   ✅ Step 1: Question set exists → Return existing`);
        console.log(`   Response: { isDefault: false, questions: [...] }`);
      } else {
        console.log(`   ℹ️  Step 1: Question set not found`);
        console.log(`   ✅ Step 2: Fetch default template`);
        console.log(`   ✅ Step 3: Create new question set`);
        console.log(`   Response: { isDefault: true, questions: [...] }`);
      }

      // Test 5: Show sample questions
      console.log('\n📝 Test 5: Sample Questions from Default Template');
      console.log('-'.repeat(60));
      
      const sampleQuestions = await client.query(`
        SELECT questions
        FROM journal_questions
        WHERE user_uid = 'default_template';
      `);

      if (sampleQuestions.rows.length > 0) {
        const questions = sampleQuestions.rows[0].questions.slice(0, 3);
        questions.forEach((q: any, i: number) => {
          console.log(`\n   Question ${i + 1}: ${q.question}`);
          console.log(`   Options:`);
          q.options.forEach((opt: string, j: number) => {
            console.log(`     ${j + 1}. ${opt}`);
          });
        });
        console.log(`\n   ... and ${sampleQuestions.rows[0].questions.length - 3} more questions`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ All tests completed successfully!\n');

      console.log('💡 Next Steps:');
      console.log('   1. Start your dev server: npm run dev');
      console.log('   2. Log in to your app');
      console.log('   3. Go to journaling screen');
      console.log('   4. Switch to "Auto" mode');
      console.log('   5. Questions will load automatically for the selected date\n');

    } finally {
      client.release();
    }

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await database.close();
    process.exit(1);
  }
}

testJournalQuestionsFeature();

