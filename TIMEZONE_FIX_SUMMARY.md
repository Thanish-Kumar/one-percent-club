# Timezone Fix Summary - November 7, 2025

## Problem Identified ❌

**Symptom:**
- `crew_responses` table correctly showed **November 7**
- `journal_questions` table incorrectly showed **November 6**

**Root Cause:**
JavaScript's `Date.toISOString()` method converts dates to UTC timezone, which shifts dates backwards when the server is in a timezone ahead of UTC (like IST, which is UTC+5:30).

### Example of the Problem

```javascript
// Server time: November 7, 2025 at 2:00 AM IST (UTC+5:30)
const date = new Date('2025-11-07T02:00:00+05:30');
console.log(date.toISOString());  // "2025-11-06T20:30:00.000Z" ❌ 
console.log(date.toISOString().split('T')[0]);  // "2025-11-06" ❌ WRONG DATE!
```

## Solution Implemented ✅

**Key Change:** Use PostgreSQL's `DATE(created_at)` function to get the date string directly from the database, avoiding JavaScript timezone conversion entirely.

### Code Changes

#### Before (Incorrect):
```typescript
async upsertCrewResponse(data: CreateCrewResponseRequestDTO) {
  // Query didn't return date separately
  const query = `
    INSERT INTO crew_responses (...)
    VALUES ($1, $2, $3, $4, CURRENT_DATE)
    ...
    RETURNING *
  `;
  
  const result = await client.query(query, values);
  const crewResponse = mapRowToCrewResponse(result.rows[0]);
  
  // ❌ This uses JavaScript to convert Date object to string, causing timezone shift
  await this.syncQuestionsToJournalTable(
    data.userUid, 
    crewResponse.createdAt,  // Date object
    data.responseData
  );
}

private async syncQuestionsToJournalTable(
  userUid: string,
  createdAt: Date,  // Date object
  responseData: Record<string, any>
) {
  // ❌ Timezone conversion happens here
  const entryDate = createdAt.toISOString().split('T')[0];
  // ...
}
```

#### After (Correct):
```typescript
async upsertCrewResponse(data: CreateCrewResponseRequestDTO) {
  // ✅ Query now returns DATE(created_at) as entry_date
  const query = `
    INSERT INTO crew_responses (...)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ...
    RETURNING *, DATE(created_at) as entry_date
  `;
  
  const result = await client.query(query, values);
  const row = result.rows[0];
  const crewResponse = mapRowToCrewResponse(row);
  
  // ✅ Get date string directly from database query (no conversion!)
  const entryDate = row.entry_date;
  
  // ✅ Pass date string directly to sync method
  await this.syncQuestionsToJournalTable(
    data.userUid, 
    entryDate,  // String from database: "2025-11-07"
    data.responseData
  );
}

private async syncQuestionsToJournalTable(
  userUid: string,
  entryDate: string,  // ✅ String, not Date object
  responseData: Record<string, any>
) {
  // ✅ Use date string directly, no conversion needed
  // entryDate is already in YYYY-MM-DD format from PostgreSQL
  // ...
}
```

### Key Changes Made

1. **SQL Query Update:**
   - Changed `CURRENT_DATE` to `CURRENT_TIMESTAMP` for full timestamp
   - Added `DATE(created_at) as entry_date` to RETURNING clause

2. **Method Signature Update:**
   - `syncQuestionsToJournalTable` now accepts `string` instead of `Date`
   - Added JSDoc comments explaining the timezone handling

3. **Date Extraction:**
   - Extract `entry_date` directly from query result: `row.entry_date`
   - Pass this string directly to sync method (no JavaScript conversion)

## Files Modified

- ✅ `src/repositories/crew-response/AwsRdsCrewResponseRepository.ts`
- ✅ `CREW_SCHEDULER_JOURNAL_SYNC.md` (updated documentation)
- ✅ `TIMEZONE_FIX_SUMMARY.md` (this file)

## How to Verify the Fix

### 1. Check the Database

```sql
-- Both queries should return the same date
SELECT user_uid, DATE(created_at) as date 
FROM crew_responses 
WHERE user_uid = 'your_user_uid' 
ORDER BY created_at DESC 
LIMIT 1;

SELECT user_uid, entry_date 
FROM journal_questions 
WHERE user_uid = 'your_user_uid' 
ORDER BY entry_date DESC 
LIMIT 1;
```

### 2. Check the Logs

When the scheduler runs, you should see:

```
🔄 Processing user your_user_uid...
✅ Created response for user your_user_uid (ID: 123)
✅ Created journal questions for user your_user_uid on 2025-11-07
```

Both dates should match!

### 3. Test the Scheduler

Run the scheduler manually to test:

```bash
# Start the scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 60}'

# Or run it immediately
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "runNow"}'
```

## Expected Behavior Now

✅ **Correct:** Both tables will always have the same date  
✅ **Correct:** Date reflects the database server's timezone  
✅ **Correct:** No more date mismatches between tables  

## Why This Works

PostgreSQL's `DATE()` function:
- Operates in the database server's timezone
- Returns a date string without time component
- No JavaScript Date object conversion involved
- Consistent across both tables

```
Database Server (PostgreSQL)
  ├─ Timezone: IST (UTC+5:30)
  ├─ Current time: November 7, 2025 2:00 AM
  ├─ DATE(created_at) → "2025-11-07" ✅
  └─ Returns string directly to Node.js → No conversion! ✅
```

## Deployment

No database migration needed. Just deploy the updated code and it will work immediately.

## Testing Checklist

- [x] Code updated
- [x] No linter errors
- [x] Documentation updated
- [ ] Deploy to server
- [ ] Run scheduler manually
- [ ] Verify both tables have same date
- [ ] Check logs for confirmation
- [ ] Test with journaling UI

## Rollback Plan

If needed, you can temporarily disable the sync by commenting this line in `upsertCrewResponse()`:

```typescript
// await this.syncQuestionsToJournalTable(data.userUid, entryDate, data.responseData);
```

The scheduler will continue working, just without syncing to `journal_questions`.

