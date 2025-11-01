# Crew Scheduler - One Entry Per User Per Day

## Overview

The crew scheduler now enforces **one entry per user per day** with **smart skip logic**. When the scheduler runs multiple times in a day:

1. **First run**: Calls API and creates entry
2. **Subsequent runs**: Skips the user (no API call, saves costs!)

This prevents redundant API calls while ensuring clean, daily historical data.

## How It Works

### Smart Skip Logic
The scheduler now **checks before calling the API**:
1. **First run of the day**: Creates a new entry with today's date
2. **Subsequent runs**: Skips the user (no API call, saves costs!)

### Database Constraint
- A unique index ensures only one entry per user per day: `(user_uid, DATE(created_at))`
- The scheduler checks if an entry exists before making expensive API calls

### Optimized Behavior
```
Check DB → Entry exists? → Yes → Skip user (no API call)
                       ↓
                       No → Call API → Save response
```

### Tracked Timestamps
- `created_at`: When the entry was first created (date remains the same for the day)
- `updated_at`: When the entry was last modified (updates each time)

## Database Schema

```sql
CREATE TABLE crew_responses (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    request_context TEXT,
    request_goal TEXT,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one entry per user per day
    UNIQUE (user_uid, DATE(created_at))
);
```

## Migration

If you've already run the initial migration, run the update migration:

```bash
npm run db:migrate:crew-responses-update
```

This will:
- ✅ Add `updated_at` column
- ✅ Create automatic update trigger
- ✅ Remove duplicate entries (keeps most recent)
- ✅ Add unique constraint (user_uid + date)

## Example Behavior

### Scenario: Scheduler runs 3 times on November 1st

**First run (9:00 AM):**
```
🔄 Processing user user123...
✅ Created response for user user123 (ID: 1)

Database:
- Created: 2025-11-01 09:00:00
- Response: { "Questions": [...] }
```

**Second run (12:00 PM):**
```
⏭️  Skipping user user123 - questions already captured today
❌ NO API CALL MADE (saves time & money!)

Database: (unchanged)
- Created: 2025-11-01 09:00:00
- Response: { "Questions": [...] }
```

**Third run (3:00 PM):**
```
⏭️  Skipping user user123 - questions already captured today
❌ NO API CALL MADE

Database: (unchanged)
- Created: 2025-11-01 09:00:00
- Response: { "Questions": [...] }
```

**Next day (November 2nd):**
```
🔄 Processing user user123...
✅ Created response for user user123 (ID: 2)

Database:
- Created: 2025-11-02 09:00:00  ← New date = new entry
- Response: { "Questions": [...] }
```

## Console Logs

The scheduler will indicate whether an entry was created or skipped:

**First run of the day:**
```
🔄 Processing user user123...
✅ Created response for user user123 (ID: 1)

Summary: 1 created, 0 skipped (already captured today), 0 failed
```

**Subsequent runs (same day):**
```
⏭️  Skipping user user123 - questions already captured today

Summary: 0 created, 1 skipped (already captured today), 0 failed
```

**Next day:**
```
🔄 Processing user user123...
✅ Created response for user user123 (ID: 2)

Summary: 1 created, 0 skipped (already captured today), 0 failed
```

## API Response

The API returns `updatedAt` to indicate if the entry was modified:

```json
{
  "id": 1,
  "userUid": "user123",
  "requestContext": "building solution...",
  "requestGoal": "Rapid growth",
  "responseData": { ... },
  "createdAt": "2025-11-01T09:00:00.000Z",
  "updatedAt": "2025-11-01T15:00:00.000Z"
}
```

If `createdAt` and `updatedAt` are different, the entry was updated.

## Benefits

### 1. **Cost Savings 💰**
- **Only one API call per user per day** - subsequent runs are skipped
- The crew API takes 20+ seconds per call - avoiding redundant calls saves significant time
- No wasted API costs for data that was already captured

### 2. **No Duplicates**
- Clean database with one entry per user per day
- Easy to query latest response

### 3. **Performance**
- Skip logic checks database (milliseconds) instead of calling external API (20+ seconds)
- Scheduler completes much faster on subsequent runs

### 4. **Historical Tracking**
- `created_at` shows when the first response was received
- Each day creates a new entry (for daily trend analysis)

### 5. **Storage Efficiency**
- Doesn't accumulate multiple entries per day
- Keeps database size manageable

## Querying Data

### Get latest response for a user
```bash
curl "http://localhost:3000/api/crew-responses?userUid=user123&limit=1"
```

### Get all responses for a user (one per day)
```bash
curl "http://localhost:3000/api/crew-responses?userUid=user123&limit=30"
```

### Check if entry was updated today
Query will return `updatedAt` different from `createdAt` if it was refreshed.

## Scheduler Configuration

### Run Multiple Times Per Day
You can safely run the scheduler multiple times:

```bash
# Every 30 minutes
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 30}'
```

Only the last run of each day will be stored.

### Run Once Per Day
```bash
# Every 24 hours (1440 minutes)
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 1440}'
```

## Technical Details

### Upsert Query
```sql
INSERT INTO crew_responses 
  (user_uid, request_context, request_goal, response_data, created_at)
VALUES ($1, $2, $3, $4, CURRENT_DATE)
ON CONFLICT (user_uid, DATE(created_at))
DO UPDATE SET
  request_context = EXCLUDED.request_context,
  request_goal = EXCLUDED.request_goal,
  response_data = EXCLUDED.response_data,
  updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

### Key Points
- `created_at` is set to `CURRENT_DATE` (00:00:00 of today)
- This ensures the unique constraint works properly
- `updated_at` is automatically updated via trigger
- All data fields are replaced with new values

## Backwards Compatibility

### Existing Data
The migration removes duplicate entries automatically, keeping the most recent one per user per day.

### API Endpoints
All existing API endpoints work the same:
- `GET /api/crew-responses` - Returns one entry per user per day
- `POST /api/crew-responses` - Still creates (if you call directly)
- Scheduler uses upsert internally

### Repository Methods
- `createCrewResponse()` - Still available (creates new, may fail if duplicate date)
- `upsertCrewResponse()` - New method (create or update, recommended)

## Troubleshooting

### Duplicate Key Error
If you see an error about duplicate keys, run the update migration:
```bash
npm run db:migrate:crew-responses-update
```

### Old Duplicates
The migration automatically removes old duplicates, keeping the most recent entry per user per day.

### Testing Upsert
Run the scheduler multiple times:
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

Check the logs - you should see "Updated" instead of "Created" on subsequent runs.

## Summary

✅ **One entry per user per day** enforced at database level  
✅ **Smart skip logic** - checks database before calling API  
✅ **Cost optimization** - only one API call per user per day  
✅ **Performance** - subsequent runs complete in seconds (not minutes)  
✅ **No duplicates** - clean database structure  
✅ **Historical data** - one entry per day for trend analysis  

### Key Improvement: Skip Logic

The scheduler now **checks if data exists before calling the API**:
- ✅ First run: Calls API and saves data
- ⏭️  Subsequent runs: Skips user (no API call!)
- 💰 Result: Significant cost and time savings

This ensures your database stays clean while **avoiding expensive redundant API calls**! 🎯

