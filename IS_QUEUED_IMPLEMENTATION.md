# is_queued Column Implementation Guide

## Overview

This document describes the implementation of the `is_queued` column in the `journal_entries` table. This feature prevents duplicate processing of journal entries by the both-crews API.

## Purpose

The `is_queued` column serves as a processing lock to ensure that:
1. Journal entries are not processed multiple times simultaneously
2. Entries that are already being processed are not picked up again
3. Failed processing can be retried later by unmarking the queue status

## Database Changes

### Migration File
**File:** `src/lib/migrations/add_is_queued_column_to_journal_entries.sql`

```sql
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS is_queued BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_journal_entries_is_queued ON journal_entries(is_queued);
```

### Migration Runner Script
**File:** `src/lib/scripts/run-is-queued-migration.ts`

Run the migration with:
```bash
npm run db:migrate:is-queued
```

Or directly with tsx:
```bash
npx tsx src/lib/scripts/run-is-queued-migration.ts
```

## Code Changes

### 1. JournalEntry Model
**File:** `src/models/JournalEntry.ts`

Added `isQueued` field to the interface:
```typescript
export interface JournalEntry {
  id: number;
  userUid: string;
  entryDate: Date;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  isProcessedForSolutions: boolean;
  isQueued: boolean; // NEW
}
```

### 2. Repository Interface
**File:** `src/repositories/journal/JournalRepository.ts`

Added new methods:
```typescript
markEntryAsQueued(id: number): Promise<boolean>;
markEntryAsUnqueued(id: number): Promise<boolean>;
```

### 3. Repository Implementation
**File:** `src/repositories/journal/AwsRdsJournalRepository.ts`

#### New Methods
- `markEntryAsQueued(id)` - Sets `is_queued = TRUE`
- `markEntryAsUnqueued(id)` - Sets `is_queued = FALSE`

#### Updated Methods
- `getUnprocessedEntriesForDate()` - Now excludes entries where `is_queued = TRUE`
- `upsertEntry()` - Resets `is_queued = FALSE` when entry is updated
- `mapRowToJournalEntry()` - Maps the `is_queued` column to `isQueued` field

### 4. BothCrewsService
**File:** `src/services/both-crews/BothCrewsService.ts`

#### Updated Flow

1. **When adding to queue** (`addToQueue`):
   - Marks entry as queued in database: `is_queued = TRUE`
   - Adds entry to processing queue

2. **On successful processing** (`processEntry`):
   - Marks entry as processed: `is_processed_for_solutions = TRUE`
   - Marks entry as unqueued: `is_queued = FALSE`

3. **On failed processing** (`processEntry` catch block):
   - If retries remain: Keeps `is_queued = TRUE` (stays in queue)
   - If max retries reached: Marks `is_queued = FALSE` (allows retry later)

## Processing Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Scheduler runs processTodayEntries()                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Query: Get unprocessed entries                          │
│ WHERE is_processed_for_solutions = FALSE                │
│   AND is_queued = FALSE                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ For each entry:                                         │
│   1. Mark is_queued = TRUE                              │
│   2. Add to processing queue                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Background Processor (runs every 2 seconds)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│  SUCCESS      │         │  FAILURE      │
│               │         │               │
│ Set:          │         │ If retries:   │
│ - processed   │         │   Keep queued │
│   = TRUE      │         │               │
│ - queued      │         │ If no retries:│
│   = FALSE     │         │   Set queued  │
│               │         │   = FALSE     │
└───────────────┘         └───────────────┘
```

## Query Behavior

### Before Change
```sql
SELECT * FROM journal_entries
WHERE entry_date = '2025-11-08'
  AND is_processed_for_solutions = FALSE;
```
- Could pick up the same entry multiple times if processing is slow
- Risk of duplicate processing

### After Change
```sql
SELECT * FROM journal_entries
WHERE entry_date = '2025-11-08'
  AND is_processed_for_solutions = FALSE
  AND is_queued = FALSE;
```
- Only picks up entries that are not currently being processed
- Prevents duplicate processing
- Failed entries can be retried (after `is_queued` is set to FALSE)

## Key Benefits

✅ **Prevents Duplicate Processing** - Entries being processed won't be picked up again  
✅ **Automatic Retry on Failure** - Failed entries are unmarked for future retry  
✅ **Safe Concurrent Operations** - Multiple scheduler runs won't interfere  
✅ **Database-Level Locking** - Uses database state, not just in-memory queue  
✅ **Entry Update Safety** - Editing an entry resets both flags for reprocessing  

## Usage Notes

1. **Running the Migration**
   ```bash
   npm run db:migrate:is-queued
   ```

2. **Monitoring Queue Status**
   - Check `is_queued` column in database to see what's being processed
   - Use `bothCrewsService.getQueueStatus()` for in-memory queue status

3. **Manual Intervention**
   If an entry gets stuck with `is_queued = TRUE`:
   ```sql
   UPDATE journal_entries 
   SET is_queued = FALSE 
   WHERE id = <entry_id>;
   ```

4. **Entry Updates**
   When a user edits a journal entry:
   - Both `is_processed_for_solutions` and `is_queued` are reset to FALSE
   - Entry will be picked up for processing again

## Testing Checklist

- [ ] Run the migration script
- [ ] Verify column exists: `SELECT is_queued FROM journal_entries LIMIT 1;`
- [ ] Test scheduler: Ensure entries are marked as queued
- [ ] Test success: Verify entries are marked as unqueued after processing
- [ ] Test failure: Verify entries are marked as unqueued after max retries
- [ ] Test concurrency: Run scheduler multiple times, ensure no duplicates
- [ ] Test entry update: Edit entry, verify flags are reset

## Files Modified

1. `src/lib/migrations/add_is_queued_column_to_journal_entries.sql` - NEW
2. `src/lib/scripts/run-is-queued-migration.ts` - NEW
3. `src/models/JournalEntry.ts` - MODIFIED
4. `src/repositories/journal/JournalRepository.ts` - MODIFIED
5. `src/repositories/journal/AwsRdsJournalRepository.ts` - MODIFIED
6. `src/services/both-crews/BothCrewsService.ts` - MODIFIED

## Related Documentation

- [BOTH_CREWS_IMPLEMENTATION_SUMMARY.md](./BOTH_CREWS_IMPLEMENTATION_SUMMARY.md)
- [JOURNAL_FEATURE_GUIDE.md](./JOURNAL_FEATURE_GUIDE.md)

