# Crew Scheduler Service Guide

## Overview

The Crew Scheduler Service is a server-side component that periodically fetches user data (context and goal) from the database, sends it to an external crew API, and stores the responses in a dedicated database table.

## Features

- ⏰ Configurable time intervals (in minutes)
- 🔄 Automatic periodic execution
- 💾 Stores API responses in the database
- 🎯 Processes all users with context and goal data
- 📊 Provides status and manual execution endpoints
- 🛡️ Error handling and logging

## Setup

### 1. Environment Variables

Add the following to your `.env` file (see `env.example`):

```env
# Crew Scheduler Configuration
CREW_API_URL=http://13.53.53.18:8000/run-crew
CREW_SCHEDULER_INTERVAL_MINUTES=60
```

### 2. Database Migration

Run the migration to create the `crew_responses` table:

```bash
npm run db:migrate:crew-responses
```

This will create the `crew_responses` table with the following schema:
- `id` - Primary key
- `user_uid` - Foreign key to users table
- `request_context` - The context sent in the request
- `request_goal` - The goal sent in the request
- `response_data` - JSON response from the crew API
- `created_at` - Timestamp of when the response was received

## API Endpoints

### 1. Get Scheduler Status

**GET** `/api/scheduler`

Returns the current status of the scheduler.

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "intervalMinutes": 60,
    "apiUrl": "http://13.53.53.18:8000/run-crew"
  }
}
```

### 2. Start the Scheduler

**POST** `/api/scheduler`

Starts the scheduler with a specified interval.

**Request Body:**
```json
{
  "action": "start",
  "intervalMinutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler started with interval: 30 minutes",
  "data": {
    "isRunning": true,
    "intervalMinutes": 30,
    "apiUrl": "http://13.53.53.18:8000/run-crew"
  }
}
```

### 3. Stop the Scheduler

**POST** `/api/scheduler`

Stops the scheduler.

**Request Body:**
```json
{
  "action": "stop"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler stopped",
  "data": {
    "isRunning": false,
    "intervalMinutes": 30,
    "apiUrl": "http://13.53.53.18:8000/run-crew"
  }
}
```

### 4. Run Scheduler Manually

**POST** `/api/scheduler`

Executes the scheduler task immediately (useful for testing).

**Request Body:**
```json
{
  "action": "run-now"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler task executed manually"
}
```

### 5. Get Crew Responses

**GET** `/api/crew-responses`

Retrieves crew responses with optional filters.

**Query Parameters:**
- `userUid` (optional) - Filter by user UID
- `limit` (optional, default: 100) - Limit number of results
- `offset` (optional, default: 0) - Offset for pagination
- `startDate` (optional) - Filter by start date (ISO 8601 format)
- `endDate` (optional) - Filter by end date (ISO 8601 format)

**Example:**
```
GET /api/crew-responses?userUid=abc123&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userUid": "abc123",
      "requestContext": "Business background...",
      "requestGoal": "Rapid growth",
      "responseData": { /* API response */ },
      "createdAt": "2025-11-01T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 6. Get Single Crew Response

**GET** `/api/crew-responses/[id]`

Retrieves a single crew response by ID.

**Example:**
```
GET /api/crew-responses/1
```

### 7. Delete Crew Response

**DELETE** `/api/crew-responses/[id]`

Deletes a crew response by ID.

**Example:**
```
DELETE /api/crew-responses/1
```

## Usage Examples

### Using cURL

#### Start the scheduler with 15-minute intervals:
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 15}'
```

#### Check scheduler status:
```bash
curl http://localhost:3000/api/scheduler
```

#### Run the scheduler manually (for testing):
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

#### Stop the scheduler:
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

#### Get crew responses for a specific user:
```bash
curl "http://localhost:3000/api/crew-responses?userUid=abc123"
```

### Using JavaScript/Fetch

```javascript
// Start scheduler with 30-minute interval
const startScheduler = async () => {
  const response = await fetch('/api/scheduler', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'start',
      intervalMinutes: 30
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Get scheduler status
const getStatus = async () => {
  const response = await fetch('/api/scheduler');
  const data = await response.json();
  console.log(data);
};

// Get crew responses
const getCrewResponses = async (userUid) => {
  const response = await fetch(`/api/crew-responses?userUid=${userUid}&limit=10`);
  const data = await response.json();
  console.log(data);
};
```

## How It Works

1. **Initialization**: The scheduler service is a singleton that can be controlled via API endpoints.

2. **Scheduled Execution**: When started, the service runs at the specified interval (in minutes).

3. **User Processing**: For each execution:
   - Fetches all users from the database (up to 1000 users per run)
   - For each user with `context` or `goal` data:
     - Prepares a POST request with the user's context and goal
     - Sends it to the crew API endpoint
     - Stores the JSON response in the `crew_responses` table

4. **Request Format**: The scheduler sends this JSON to the crew API:
   ```json
   {
     "customer_business_background_latest": "user's context",
     "customer_goal_latest": "user's goal"
   }
   ```

5. **Storage**: Responses are stored with:
   - User UID (for association)
   - Request data (context and goal)
   - Full API response (as JSON)
   - Timestamp

## Database Schema

### crew_responses Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_uid | VARCHAR(255) | Foreign key to users.uid |
| request_context | TEXT | Context sent in request |
| request_goal | TEXT | Goal sent in request |
| response_data | JSONB | JSON response from API |
| created_at | TIMESTAMP | When the response was saved |

**Indexes:**
- `user_uid` - Fast user lookups
- `created_at` - Time-based queries
- `(user_uid, created_at)` - Combined user+time queries

## Architecture

```
CrewSchedulerService (Singleton)
    ├── Uses node-cron for scheduling
    ├── Fetches users via AwsRdsUserRepository
    ├── Calls external crew API
    └── Stores responses via AwsRdsCrewResponseRepository

API Routes
    ├── /api/scheduler - Control the scheduler
    └── /api/crew-responses - Access stored responses
```

## Error Handling

The scheduler includes comprehensive error handling:

- **Database errors**: Logged and returned with user-friendly messages
- **API failures**: Logged per user, other users continue processing
- **Connection issues**: Automatic retry on next scheduled run
- **Invalid data**: Skips users without context/goal

## Logging

The service logs:
- Scheduler start/stop events
- Task execution start/end times
- Number of users processed
- Success/failure counts
- Individual user processing errors

Check your console/logs for detailed execution information.

## Best Practices

1. **Interval Selection**: Choose an interval that balances:
   - API rate limits
   - Database load
   - Data freshness requirements
   - Number of users

2. **Monitoring**: Regularly check:
   - Scheduler status via `/api/scheduler`
   - Stored responses via `/api/crew-responses`
   - Application logs for errors

3. **Testing**: Use the `run-now` action to test before starting the scheduler

4. **Production**: Consider:
   - Setting up proper logging and monitoring
   - Implementing retry logic for failed API calls
   - Adding authentication to the scheduler endpoints
   - Setting up alerts for scheduler failures

## Troubleshooting

### Scheduler not running?
- Check if it was started: `GET /api/scheduler`
- Check environment variables are set
- Check database connection

### No responses being saved?
- Verify the crew API is accessible
- Check if users have `context` and `goal` data
- Look for errors in the console logs
- Try `run-now` to test immediately

### API errors?
- Verify `CREW_API_URL` is correct
- Check if the external API is online
- Verify request format matches API expectations

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify database migrations were run successfully
3. Test with `run-now` action for immediate feedback
4. Review the response data structure from the crew API

