# Crew Scheduler - Skip Logic Implementation

## Problem Solved

**Before:** The scheduler would call the expensive crew API every time it ran, even for users who already had responses captured today. This wasted:
- API costs (unnecessary calls)
- Time (20+ seconds per API call)
- Server resources

**After:** The scheduler checks the database first. If a user already has data for today, it skips them entirely - no API call made!

## How It Works

### Flow Chart

```
Start Scheduler
     ↓
Fetch all users
     ↓
For each user:
     ↓
Has context/goal? ────NO──→ Skip user
     ↓ YES
     ↓
Check: Has response for today? ────YES──→ Skip user (✅ Cost saved!)
     ↓ NO
     ↓
Call crew API (20+ seconds)
     ↓
Save response to database
     ↓
Next user
```

### Code Implementation

**Check before API call:**
```typescript
// Check if questions are already captured for this user today
const hasResponseToday = await awsRdsCrewResponseRepository.hasResponseForToday(user.uid);

if (hasResponseToday) {
  console.log(`⏭️  Skipping user ${user.uid} - questions already captured today`);
  skippedCount++;
  continue; // Skip API call!
}

// Only make API call if no response exists for today
const response = await fetch(crewApiUrl, { ... });
```

**Database query (milliseconds):**
```sql
SELECT EXISTS(
  SELECT 1 FROM crew_responses 
  WHERE user_uid = $1 
  AND DATE(created_at) = CURRENT_DATE
) as exists
```

## Benefits

### 💰 Cost Savings

**Example: 100 users, scheduler runs every 30 minutes**

| Time | Without Skip Logic | With Skip Logic |
|------|-------------------|-----------------|
| 9:00 AM | 100 API calls (33 min) | 100 API calls (33 min) |
| 9:30 AM | 100 API calls (33 min) | 0 API calls (1 sec) ✅ |
| 10:00 AM | 100 API calls (33 min) | 0 API calls (1 sec) ✅ |
| 10:30 AM | 100 API calls (33 min) | 0 API calls (1 sec) ✅ |
| ... | ... | ... |
| **Daily Total** | **4,800 API calls** | **100 API calls** ✅ |

**Result: 98% reduction in API calls!**

### ⚡ Performance

- **DB check**: ~5ms per user
- **API call**: ~20,000ms per user
- **Speedup**: 4000x faster for subsequent runs!

### 📊 Clean Data

- One entry per user per day
- Historical tracking (daily snapshots)
- No duplicate data

## Console Output

### First Run (Morning)
```
[2025-11-01T09:00:00.000Z] Starting crew scheduler task...
Found 3 users to process

🔄 Processing user abc123...
✅ Created response for user abc123 (ID: 1)

🔄 Processing user def456...
✅ Created response for user def456 (ID: 2)

🔄 Processing user ghi789...
✅ Created response for user ghi789 (ID: 3)

[2025-11-01T09:33:45.000Z] Crew scheduler task completed.
Summary: 3 created, 0 skipped (already captured today), 0 failed
```

### Second Run (30 mins later)
```
[2025-11-01T09:30:00.000Z] Starting crew scheduler task...
Found 3 users to process

⏭️  Skipping user abc123 - questions already captured today
⏭️  Skipping user def456 - questions already captured today
⏭️  Skipping user ghi789 - questions already captured today

[2025-11-01T09:30:01.234Z] Crew scheduler task completed.
Summary: 0 created, 3 skipped (already captured today), 0 failed
```

**Notice:** Second run completes in ~1 second instead of ~33 minutes!

### Next Day
```
[2025-11-02T09:00:00.000Z] Starting crew scheduler task...
Found 3 users to process

🔄 Processing user abc123...
✅ Created response for user abc123 (ID: 4)
... (all users processed again)

Summary: 3 created, 0 skipped (already captured today), 0 failed
```

## Testing

### Manual Test

Run the scheduler twice on the same day:

```bash
# First run - should call API
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'

# Wait for completion, then run again
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

**Expected:**
- First run: "Created response for user..."
- Second run: "Skipping user... - questions already captured today"

### Database Verification

Check that only one entry exists per user per day:

```sql
SELECT user_uid, DATE(created_at) as date, COUNT(*) as count
FROM crew_responses
GROUP BY user_uid, DATE(created_at)
HAVING COUNT(*) > 1;
```

**Expected:** Zero rows (no duplicates)

## Implementation Details

### New Repository Methods

**`hasResponseForToday(userUid: string): Promise<boolean>`**
- Fast check using SQL `EXISTS`
- Returns true if user has response for today
- Used by scheduler before API calls

**`getResponseForToday(userUid: string): Promise<CrewResponseDatabaseDTO | null>`**
- Retrieves today's response for a user
- Useful for debugging or manual checks

### Scheduler Logic

```typescript
for (const user of users) {
  // 1. Check context/goal
  if (!user.context && !user.goal) {
    skippedCount++;
    continue;
  }

  // 2. Check if already captured today (NEW!)
  const hasResponseToday = await repository.hasResponseForToday(user.uid);
  if (hasResponseToday) {
    skippedCount++;
    continue; // Skip API call
  }

  // 3. Only call API if needed
  const response = await fetch(apiUrl, ...);
  const data = await response.json();
  
  // 4. Save response
  await repository.upsertCrewResponse({ userUid, data });
  successCount++;
}
```

## Monitoring

### Metrics to Track

1. **Skip Rate**: `skipped / (created + skipped)`
   - Should be high (80-98%) after first run each day

2. **Execution Time**: 
   - First run: ~20 seconds per user
   - Subsequent runs: <1 second total

3. **API Call Count**:
   - Should equal number of users × 1 per day
   - Not users × runs per day

### Log Analysis

```bash
# Count how many were skipped today
grep "Skipping user" scheduler.log | wc -l

# Count how many were created today
grep "Created response" scheduler.log | wc -l

# Average execution time
grep "task completed" scheduler.log
```

## Configuration

### Optimal Scheduling

Since we skip existing entries, you can schedule aggressively:

```bash
# Run every 30 minutes - safe and efficient!
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 30}'
```

**Why this works:**
- Morning run: Captures data (slow)
- Rest of day: Fast skips (<1 sec each)
- Next day: Fresh data capture

### Alternative: Once Daily

If you prefer simplicity:

```bash
# Run once per day at 9 AM (1440 minutes = 24 hours)
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 1440}'
```

## Troubleshooting

### Users Not Being Skipped

**Check 1:** Verify migration was run
```bash
npm run db:migrate:crew-responses-update
```

**Check 2:** Check database
```sql
SELECT user_uid, DATE(created_at), COUNT(*)
FROM crew_responses
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY user_uid, DATE(created_at);
```

**Check 3:** Look for errors in logs
```bash
grep "Error" scheduler.log
```

### All Users Being Skipped

This is normal if:
- Scheduler already ran today
- All users have entries for today

To force new entries, wait until the next day.

## Summary

✅ **Smart skip logic** prevents redundant API calls  
✅ **98% cost reduction** for frequent scheduling  
✅ **4000x faster** subsequent runs  
✅ **One entry per user per day** maintained  
✅ **Historical daily data** preserved  

The skip logic makes it safe and efficient to run the scheduler frequently (every 30 minutes) without wasting API calls or time! 🚀

