# Crew Scheduler - One Entry Per User Per Day

## Overview

The crew scheduler now enforces **one entry per user per day**. When the scheduler runs multiple times in a day, it will **UPDATE** the existing entry for that user instead of creating a new one.

## How It Works

### Database Constraint
- A unique index ensures only one entry per user per day: `(user_uid, DATE(created_at))`
- If a second entry is attempted for the same user on the same day, it will update the existing entry instead

### Upsert Behavior
The scheduler uses PostgreSQL's `INSERT ... ON CONFLICT ... DO UPDATE` to:
1. **First run of the day**: Creates a new entry with today's date
2. **Subsequent runs**: Updates the existing entry for today

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
User: user123
Created: 2025-11-01 09:00:00
Updated: 2025-11-01 09:00:00
Response: { "Questions": [...] }
```

**Second run (12:00 PM):**
```
User: user123
Created: 2025-11-01 09:00:00  ← Same date
Updated: 2025-11-01 12:00:00  ← Updated timestamp
Response: { "Questions": [...] }  ← New data replaces old
```

**Third run (3:00 PM):**
```
User: user123
Created: 2025-11-01 09:00:00  ← Same date
Updated: 2025-11-01 15:00:00  ← Updated timestamp
Response: { "Questions": [...] }  ← Latest data
```

**Next day (November 2nd):**
```
User: user123
Created: 2025-11-02 09:00:00  ← New date
Updated: 2025-11-02 09:00:00
Response: { "Questions": [...] }  ← New entry for new day
```

## Console Logs

The scheduler will indicate whether an entry was created or updated:

```
✅ Created response for user user123 (ID: 1)
✅ Updated response for user user123 (ID: 1)
✅ Updated response for user user123 (ID: 1)
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

### 1. **No Duplicates**
- Clean database with one entry per user per day
- Easy to query latest response

### 2. **Historical Tracking**
- `created_at` shows when the first response was received
- `updated_at` shows when it was last refreshed
- Each day creates a new entry (for trend analysis)

### 3. **Storage Efficiency**
- Doesn't accumulate multiple entries per day
- Keeps database size manageable

### 4. **Latest Data**
- Always have the most recent API response for each user for each day
- Perfect for scheduling that runs multiple times per day

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
✅ **Automatic updates** when scheduler runs multiple times  
✅ **Timestamp tracking** with created_at and updated_at  
✅ **No duplicates** - clean database structure  
✅ **Historical data** - one entry per day for trend analysis  
✅ **Latest data** - always have most recent API response  

This ensures your database stays clean while capturing the most up-to-date information from the crew API! 🎯

