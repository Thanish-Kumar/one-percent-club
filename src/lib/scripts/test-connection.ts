import { config } from 'dotenv';
import { database } from '../database';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Test database connection
async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    const success = await database.testConnection();
    
    if (success) {
      console.log('✅ Database connection successful!');
      await database.close();
      process.exit(0);
    } else {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testConnection();
}

export { testConnection };

