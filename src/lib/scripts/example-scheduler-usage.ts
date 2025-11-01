/**
 * Example script demonstrating how to use the CrewSchedulerService programmatically
 * 
 * This is an alternative to using the REST API endpoints.
 * Useful for server-side integration or custom initialization.
 * 
 * NOTE: This is just an example. For production use, consider using the API endpoints.
 */

import { crewSchedulerService } from '@/services/scheduler';
import * as dotenv from 'dotenv';

// Load environment variables
// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function exampleUsage() {
  console.log('=== Crew Scheduler Service Example ===\n');

  // 1. Get current status
  console.log('1. Getting scheduler status...');
  let status = crewSchedulerService.getStatus();
  console.log('Status:', status);
  console.log('');

  // 2. Start the scheduler with 30-minute interval
  console.log('2. Starting scheduler with 30-minute interval...');
  crewSchedulerService.start(30);
  status = crewSchedulerService.getStatus();
  console.log('Status after start:', status);
  console.log('');

  // 3. Run the task immediately (for testing)
  console.log('3. Running scheduler task immediately...');
  await crewSchedulerService.runNow();
  console.log('Task completed!');
  console.log('');

  // 4. Wait a bit (in real usage, the scheduler would run automatically)
  console.log('4. Scheduler is now running in the background...');
  console.log('It will execute every 30 minutes automatically.');
  console.log('');

  // 5. Optionally change the API URL
  // crewSchedulerService.setApiUrl('https://your-custom-api.com/endpoint');

  // 6. Stop the scheduler (for this example)
  console.log('5. Stopping scheduler (for this example)...');
  crewSchedulerService.stop();
  status = crewSchedulerService.getStatus();
  console.log('Status after stop:', status);
  console.log('');

  console.log('=== Example Complete ===');
  console.log('');
  console.log('To use in production:');
  console.log('1. Start the scheduler with: crewSchedulerService.start(intervalMinutes)');
  console.log('2. Let it run in the background');
  console.log('3. Monitor via: crewSchedulerService.getStatus()');
  console.log('4. Stop when needed: crewSchedulerService.stop()');
  console.log('');
  console.log('Or use the REST API endpoints:');
  console.log('- POST /api/scheduler with {"action": "start", "intervalMinutes": 30}');
  console.log('- GET /api/scheduler to check status');
  console.log('- POST /api/scheduler with {"action": "stop"} to stop');

  process.exit(0);
}

// Run the example
exampleUsage().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});

