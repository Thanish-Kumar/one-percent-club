# Crew Scheduler Service

## Overview

This service provides scheduled task execution for calling external crew APIs with user data.

## Files

- `CrewSchedulerService.ts` - Main scheduler service implementation
- `index.ts` - Exports for the service

## Usage

### Import the Service

```typescript
import { crewSchedulerService } from '@/services/scheduler';
```

### Start the Scheduler

```typescript
// Start with 30-minute interval
crewSchedulerService.start(30);
```

### Stop the Scheduler

```typescript
crewSchedulerService.stop();
```

### Get Status

```typescript
const status = crewSchedulerService.getStatus();
console.log(status);
// {
//   isRunning: true,
//   intervalMinutes: 30,
//   apiUrl: 'http://13.53.53.18:8000/run-crew'
// }
```

### Run Immediately

```typescript
// Execute the task immediately (for testing)
await crewSchedulerService.runNow();
```

### Set Custom API URL

```typescript
// Change the crew API URL
crewSchedulerService.setApiUrl('https://your-custom-api.com/endpoint');
```

## Configuration

The service can be configured via environment variables:

- `CREW_API_URL` - The URL of the crew API endpoint
- `CREW_SCHEDULER_INTERVAL_MINUTES` - Default interval in minutes

## How It Works

1. The service uses `node-cron` to schedule periodic tasks
2. At each interval, it:
   - Fetches all users from the database
   - For each user with context/goal data:
     - Sends a POST request to the crew API
     - Stores the response in the `crew_responses` table
3. Logs success/failure for each user

## API Request Format

The service sends this JSON structure to the crew API:

```json
{
  "customer_business_background_latest": "user's context",
  "customer_goal_latest": "user's goal"
}
```

## Error Handling

- Database connection errors are logged
- Individual user failures don't stop processing of other users
- All errors are logged with details for debugging

## Implementation Details

- Singleton pattern ensures only one scheduler instance
- Uses connection pooling for database efficiency
- Supports intervals of any duration (in minutes)
- Automatically converts interval to appropriate cron expression

## Example Integration

```typescript
// In your Next.js API route or server code
import { crewSchedulerService } from '@/services/scheduler';

// Start the scheduler when your app starts
crewSchedulerService.start(60); // Run every 60 minutes

// Or use an API endpoint to control it dynamically
// See /api/scheduler for REST API implementation
```

