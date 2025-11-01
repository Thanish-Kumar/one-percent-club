# Crew Scheduler Setup Instructions

## Quick Setup (5 minutes)

### 1. Configure Environment Variables

Add these to your `.env.local` file (or `.env`):

```env
# Crew Scheduler Configuration
CREW_API_URL=http://13.53.53.18:8000/run-crew
CREW_SCHEDULER_INTERVAL_MINUTES=60
```

### 2. Run Database Migrations

```bash
# Create the table
npm run db:migrate:crew-responses

# Add unique constraint (one entry per user per day)
npm run db:migrate:crew-responses-update
```

> **Note:** The second migration ensures only one entry per user per day. When the scheduler runs multiple times in a day, it will UPDATE the existing entry instead of creating duplicates.

This creates the `crew_responses` table.

### 3. Start Your Server

```bash
npm run dev
```

### 4. Start the Scheduler

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 30}'
```

Replace `30` with your desired interval in minutes.

## Verify It's Working

### Check Status
```bash
curl http://localhost:3000/api/scheduler
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "intervalMinutes": 30,
    "apiUrl": "http://13.53.53.18:8000/run-crew"
  }
}
```

### Test Immediately
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

Check your console logs to see the execution.

### View Results
```bash
curl "http://localhost:3000/api/crew-responses?limit=5"
```

## What It Does

1. **Fetches** all users from your database
2. **Sends** their context and goal to the crew API:
   ```json
   {
     "customer_business_background_latest": "user's context",
     "customer_goal_latest": "user's goal"
   }
   ```
3. **Stores** the JSON response in the `crew_responses` table

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scheduler` | GET | Get status |
| `/api/scheduler` | POST | Control (start/stop/run-now) |
| `/api/crew-responses` | GET | List responses |
| `/api/crew-responses/[id]` | GET | Get single response |
| `/api/crew-responses/[id]` | DELETE | Delete response |

## Control Commands

**Start:**
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 60}'
```

**Stop:**
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

**Run Now:**
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

## Documentation

- **Quick Start**: `CREW_SCHEDULER_QUICK_START.md`
- **Full Guide**: `CREW_SCHEDULER_GUIDE.md`
- **Implementation Details**: `CREW_SCHEDULER_IMPLEMENTATION_SUMMARY.md`

## Troubleshooting

**Nothing happening?**
- Check if users have `context` or `goal` data in the database
- Verify the crew API URL is correct
- Look at console logs for errors

**Need help?**
- See `CREW_SCHEDULER_GUIDE.md` for detailed troubleshooting
- Check the example script: `src/lib/scripts/example-scheduler-usage.ts`

## Files Created

```
Database:
✅ src/lib/migrations/create_crew_responses_table.sql
✅ src/lib/scripts/run-crew-response-migration.ts

Models & DTOs:
✅ src/models/CrewResponse.ts
✅ src/dto/crew-response.ts

Repositories:
✅ src/repositories/crew-response/CrewResponseRepository.ts
✅ src/repositories/crew-response/AwsRdsCrewResponseRepository.ts
✅ src/repositories/crew-response/index.ts

Services:
✅ src/services/scheduler/CrewSchedulerService.ts
✅ src/services/scheduler/index.ts

API Routes:
✅ src/app/api/scheduler/route.ts
✅ src/app/api/crew-responses/route.ts
✅ src/app/api/crew-responses/[id]/route.ts

Scripts & Examples:
✅ src/lib/scripts/example-scheduler-usage.ts

Documentation:
✅ CREW_SCHEDULER_GUIDE.md
✅ CREW_SCHEDULER_QUICK_START.md
✅ CREW_SCHEDULER_IMPLEMENTATION_SUMMARY.md
✅ SETUP_INSTRUCTIONS.md (this file)

Configuration:
✅ env.example (updated)
✅ package.json (updated with migration script)
```

That's it! Your scheduler is ready to use. 🚀

