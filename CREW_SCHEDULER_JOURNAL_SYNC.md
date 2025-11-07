# Crew Scheduler Journal Questions Sync

## Overview

The crew scheduler now **automatically syncs questions** from the `crew_responses` table to the `journal_questions` table. When the scheduler updates a user's crew response, it also updates their journal questions for the same date.

## Timezone Handling ⚠️ IMPORTANT

**The sync uses `DATE(created_at)` directly from PostgreSQL** to avoid timezone conversion issues.

### Why This Matters

JavaScript's `Date.toISOString()` converts dates to UTC, which can shift the date backwards if your server is in a timezone ahead of UTC:

```
Example (IST timezone, UTC+5:30):
- Server time: November 7, 2025 at 2:00 AM IST
- UTC time: November 6, 2025 at 8:30 PM UTC
- date.toISOString().split('T')[0] → "2025-11-06" ❌ WRONG!
- PostgreSQL DATE(created_at) → "2025-11-07" ✅ CORRECT!
```

### Solution Implemented

The query returns `DATE(created_at) as entry_date` directly from PostgreSQL, ensuring the date matches the database timezone without JavaScript conversion.

## How It Works

### Flow Diagram

```
Crew Scheduler Runs
    ↓
Calls Crew API for user
    ↓
Upserts to crew_responses table
    ↓
✨ NEW: Automatically syncs to journal_questions table
    ↓
User sees updated questions in journaling screen
```

### Implementation Details

1. **Trigger Point**: When `upsertCrewResponse()` is called in `AwsRdsCrewResponseRepository`

2. **Question Extraction**: 
   - Extracts questions from the crew response data
   - Converts from crew API format to journal question format
   - Format: `{ "Questions": [{ "Question 1": "...", "Answers": [...] }] }`

3. **Sync Logic**:
   - Checks if questions already exist for the user and date
   - **Updates** existing question set if found
   - **Creates** new question set if not found

4. **Error Handling**:
   - Sync failures are logged but don't fail the crew response upsert
   - Ensures crew response is always saved even if journal sync fails

## Code Changes

### 1. Added Imports

```typescript
import { getJournalQuestionRepository } from '@/repositories/journal-question';
import { Question } from '@/models/JournalQuestion';
```

### 2. Added Helper Function

```typescript
const extractQuestionsFromResponse = (responseData: Record<string, any>): Question[] | null => {
  // Extracts questions from crew API response format
  // Returns array of Question objects or null if no valid questions
}
```

### 3. Updated `upsertCrewResponse()` Method

```typescript
async upsertCrewResponse(data: CreateCrewResponseRequestDTO): Promise<CrewResponseDatabaseDTO> {
  // SQL query returns DATE(created_at) as entry_date to avoid timezone issues
  const query = `
    INSERT INTO crew_responses (...)
    VALUES (...)
    RETURNING *, DATE(created_at) as entry_date
  `;
  
  const result = await client.query(query, values);
  const row = result.rows[0];
  const crewResponse = mapRowToCrewResponse(row);
  
  // Get date directly from database query (no JavaScript conversion!)
  const entryDate = row.entry_date;
  
  // NEW: Sync questions to journal_questions table using DB date
  await this.syncQuestionsToJournalTable(data.userUid, entryDate, data.responseData);
  
  return crewResponse;
}
```

### 4. Added `syncQuestionsToJournalTable()` Method

```typescript
private async syncQuestionsToJournalTable(
  userUid: string, 
  entryDate: string,  // Date string from DB, NOT JavaScript Date object!
  responseData: Record<string, any>
): Promise<void> {
  // 1. Extract questions from response data
  // 2. Use entryDate directly (already in YYYY-MM-DD format from DB)
  // 3. Check if questions exist for user and date
  // 4. Update or create question set in journal_questions table
  // 5. Log result (success or failure)
}
```

## Database Tables Involved

### crew_responses Table

```sql
CREATE TABLE crew_responses (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    request_context TEXT,
    request_goal TEXT,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_uid, DATE(created_at))
);
```

### journal_questions Table

```sql
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  entry_date DATE NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_uid, entry_date)
);
```

## Benefits

✅ **Automatic Sync** - No manual intervention required  
✅ **Consistent Data** - Questions in crew_responses always match journal_questions  
✅ **One Source of Truth** - Crew API responses drive the question sets  
✅ **Error Resilient** - Sync failures don't affect crew response storage  
✅ **Logging** - Clear logs for debugging and monitoring  

## Example Behavior

### Scenario: Scheduler runs for user "user123" on Nov 6, 2025

1. **Crew scheduler calls API** and receives questions:
   ```json
   {
     "Questions": [
       { "Question 1": "What is your business size?", "Answers": ["Small", "Medium", "Large"] },
       { "Question 2": "What is your goal?", "Answers": ["Growth", "Stability", "Exit"] }
     ]
   }
   ```

2. **Updates crew_responses table**:
   - Creates/updates entry for user123 with date 2025-11-06
   - Stores full response data

3. **Syncs to journal_questions table**:
   - Checks if questions exist for user123 on 2025-11-06
   - If exists: Updates the questions
   - If not: Creates new question set

4. **User opens journaling screen**:
   - Sees the questions for 2025-11-06
   - Questions match what crew API returned

## Logs

### Success Logs

```
✅ Updated journal questions for user user123 on 2025-11-06
```

or

```
✅ Created journal questions for user user123 on 2025-11-06
```

### Warning Logs

```
⚠️  No valid questions found in crew response for user user123. Skipping journal sync.
```

### Error Logs

```
❌ Failed to sync questions to journal_questions table for user user123: [error details]
```

## Testing

### Manual Test

1. **Start the scheduler**:
   ```bash
   # Call the scheduler API
   POST /api/scheduler
   { "action": "start", "intervalMinutes": 60 }
   ```

2. **Check logs** for sync messages:
   ```
   ✅ Created response for user user123 (ID: 123)
   ✅ Created journal questions for user user123 on 2025-11-06
   ```

3. **Verify in database**:
   ```sql
   -- Check crew_responses
   SELECT * FROM crew_responses WHERE user_uid = 'user123' ORDER BY created_at DESC LIMIT 1;
   
   -- Check journal_questions
   SELECT * FROM journal_questions WHERE user_uid = 'user123' AND entry_date = '2025-11-06';
   ```

4. **Open journaling screen**:
   - Login as user123
   - Open journaling screen
   - Select date 2025-11-06
   - Verify questions are displayed

## Files Modified

- `src/repositories/crew-response/AwsRdsCrewResponseRepository.ts`
  - Added imports for journal question repository
  - Added `extractQuestionsFromResponse()` helper function
  - Updated `upsertCrewResponse()` method to call sync
  - Added `syncQuestionsToJournalTable()` private method

## No Migration Required

✅ Uses existing tables  
✅ No schema changes  
✅ Works immediately after code deployment  

## Troubleshooting

### Issue: Date Mismatch Between Tables

**Symptom:** 
- `crew_responses` shows November 7
- `journal_questions` shows November 6

**Root Cause:**  
JavaScript's `Date.toISOString()` converts to UTC, shifting dates backwards in timezones ahead of UTC (like IST).

**Fix Applied:**
```typescript
// ❌ OLD (WRONG - causes date mismatch):
const entryDate = createdAt.toISOString().split('T')[0];

// ✅ NEW (CORRECT - uses DB date directly):
const query = `... RETURNING *, DATE(created_at) as entry_date`;
const entryDate = row.entry_date;  // Direct from PostgreSQL!
```

**Verification:**
```sql
-- Both should show the same date
SELECT user_uid, DATE(created_at) FROM crew_responses WHERE user_uid = 'your_user_uid';
SELECT user_uid, entry_date FROM journal_questions WHERE user_uid = 'your_user_uid';
```

## Rollback

If you need to disable the sync feature, simply comment out this line in `upsertCrewResponse()`:

```typescript
// await this.syncQuestionsToJournalTable(data.userUid, entryDate, data.responseData);
```

The crew scheduler will continue to work normally, just without syncing to journal_questions.

