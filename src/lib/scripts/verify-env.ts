import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Verifying Environment Variables...\n');

const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const optionalVars = [
  'DB_SSL'
];

let hasErrors = false;

console.log('📋 Required Database Variables:\n');

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.error(`❌ ${varName}: NOT SET or EMPTY`);
    hasErrors = true;
  } else {
    // Mask password for security
    if (varName === 'DB_PASSWORD') {
      console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
});

console.log('\n📋 Optional Variables:\n');

optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n❌ Configuration Error!');
  console.error('\n📝 To fix this:');
  console.error('   1. Create/edit .env.local file in project root');
  console.error('   2. Copy template from env.example');
  console.error('   3. Fill in your database credentials');
  console.error('\nExample:');
  console.error('   DB_HOST=your-database-host.com');
  console.error('   DB_PORT=5432');
  console.error('   DB_NAME=oneprocentclub');
  console.error('   DB_USER=your_username');
  console.error('   DB_PASSWORD=your_password');
  console.error('   DB_SSL=true\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('✅ You can now run database migrations.\n');
  process.exit(0);
}

