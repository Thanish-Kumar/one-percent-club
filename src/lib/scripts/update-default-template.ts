import * as dotenv from 'dotenv';
import { database } from '../database';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateDefaultTemplate() {
  console.log('🔄 Updating Default Question Template\n');
  console.log('='.repeat(60));

  try {
    // Test connection
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const client = await database.getClient();

    try {
      // New clinic-focused questions
      const newQuestions = {
        "Questions": [
          {
            "Question 1": "What is the current size of your medical clinic in terms of employees and patients?",
            "Answers": [
              "Less than 100",
              "100 to 500",
              "More than 500"
            ]
          },
          {
            "Question 2": "What is your current process for scheduling patient appointments?",
            "Answers": [
              "Manual approach (telephone calls, physical diary)",
              "Semi-aligned system (spreadsheet, google calendar)",
              "Integrated software"
            ]
          },
          {
            "Question 3": "What specific area of your business would you most want to improve with the custom software?",
            "Answers": [
              "Patients record management",
              "Appointment scheduling",
              "Billing and invoicing"
            ]
          },
          {
            "Question 4": "Do you currently use any specific software for managing your clinic?",
            "Answers": [
              "We don't use any specific software",
              "We use software, but it is not integrated",
              "We use an integrated software"
            ]
          },
          {
            "Question 5": "What is your current method for storing and managing patient records?",
            "Answers": [
              "Paper files",
              "Electronic files",
              "Integrated patient management system"
            ]
          },
          {
            "Question 6": "How often does your system encounter errors that impact your clinic operations?",
            "Answers": [
              "Daily",
              "Weekly",
              "Rarely"
            ]
          },
          {
            "Question 7": "How do you currently manage your clinic's billing and invoicing process?",
            "Answers": [
              "Manually",
              "Semi-automated system",
              "Fully automated software"
            ]
          },
          {
            "Question 8": "What is your current method for providing follow-up care to patients after an appointment?",
            "Answers": [
              "Call-backs",
              "Email reminders",
              "Automated system"
            ]
          },
          {
            "Question 9": "How do you analyze your clinic's performance currently?",
            "Answers": [
              "We don't have a structured approach",
              "We analyze data manually",
              "We use software analytics"
            ]
          },
          {
            "Question 10": "Where does your clinic aim to be in terms of size and service offerings in the next 5 years?",
            "Answers": [
              "Maintain current size and services",
              "Expansion in terms of services offered",
              "Expansion in terms of size and services offered"
            ]
          }
        ]
      };

      console.log('\n📋 Updating default_template with clinic-focused questions...\n');

      // Update the default template
      await client.query(`
        UPDATE journal_questions
        SET questions = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_uid = 'default_template'
      `, [JSON.stringify(newQuestions)]);

      console.log('✅ Default template updated successfully!\n');

      // Show the new questions
      const result = await client.query(`
        SELECT questions
        FROM journal_questions
        WHERE user_uid = 'default_template'
      `);

      if (result.rows.length > 0) {
        console.log('📝 New Default Questions:');
        console.log('-'.repeat(60));
        const questions = result.rows[0].questions.Questions;
        questions.forEach((q: any, i: number) => {
          const questionKey = `Question ${i + 1}`;
          console.log(`\n${i + 1}. ${q[questionKey]}`);
          console.log(`   Options: ${q.Answers.join(' | ')}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ Update completed successfully!\n');

      console.log('💡 Note: Existing user question sets remain unchanged.');
      console.log('   New users will get these updated questions.\n');

    } finally {
      client.release();
    }

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Update failed:', error);
    await database.close();
    process.exit(1);
  }
}

updateDefaultTemplate();

