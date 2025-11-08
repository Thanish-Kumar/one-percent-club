# Both-Crews API Integration - Complete Guide

## 🎉 Feature Status: FULLY IMPLEMENTED ✅

The both-crews API integration for processing journal entries and generating solutions is **completely implemented and ready to use**!

## Overview

This feature automatically processes journal entries daily and sends them to the both-crews API to generate solutions. The solutions are stored in a dedicated table for easy retrieval and analysis.

## How It Works

### 1. **Automatic Processing via Scheduler**

When the scheduler runs (via `/api/scheduler`):
1. First, it processes all users for the crew API (existing functionality)
2. Then, it automatically processes journal entries for solutions:
   - Fetches all unprocessed journal entries for the current day
   - Sends each entry's content to the both-crews API
   - Saves the API response in the `solutions` table
   - Marks the journal entry as processed

### 2. **Smart Re-processing**

When a user updates their journal entry:
- The `is_processed_for_solutions` flag is automatically reset to `false`
- The next scheduler run will detect the change and re-process it
- A new solution is created in the solutions table (old ones are preserved)

### 3. **API Request Format**

**Endpoint:** `POST http://localhost:8000/api/v1/both-crews`

**Request Body:**
```json
{
  "qna_pairs": "## Auto Journal Entry **Q1:** What is the biggest challenge you're currently facing..."
}
```

The `qna_pairs` value is the exact content from the journal entry's `content` column.

## Database Schema

### 1. **Modified `journal_entries` Table**

```sql
ALTER TABLE journal_entries 
ADD COLUMN is_processed_for_solutions BOOLEAN DEFAULT FALSE;
```

**Column:**
- `is_processed_for_solutions`: Tracks whether the entry has been sent to the both-crews API
  - `false`: Not processed yet (or updated and needs re-processing)
  - `true`: Already processed

**Index:**
- `idx_journal_entries_processed`: Optimizes queries for unprocessed entries

### 2. **New `solutions` Table**

```sql
CREATE TABLE solutions (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    entry_date DATE NOT NULL,
    journal_entry_id INTEGER NOT NULL,
    solution JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_solution_user_uid FOREIGN KEY (user_uid) 
        REFERENCES users(uid) ON DELETE CASCADE,
    CONSTRAINT fk_solution_journal_entry FOREIGN KEY (journal_entry_id) 
        REFERENCES journal_entries(id) ON DELETE CASCADE
);
```

**Columns:**
- `id`: Primary key
- `user_uid`: User identifier (foreign key to users table)
- `entry_date`: Date of the journal entry (for easy filtering)
- `journal_entry_id`: Links to the specific journal entry
- `solution`: JSONB data containing the API response
- `created_at`: When the solution was created

**Indexes:**
- `idx_solutions_user_uid`: Fast user lookups
- `idx_solutions_entry_date`: Date-based queries
- `idx_solutions_journal_entry_id`: Journal entry lookups
- `idx_solutions_user_date`: Combined user + date queries

## Architecture

### Files Created/Modified

```
Database Migrations:
✅ src/lib/migrations/add_processed_column_to_journal_entries.sql
✅ src/lib/migrations/create_solutions_table.sql
✅ src/lib/scripts/run-solutions-migrations.ts

Models & DTOs:
✅ src/models/Solution.ts
✅ src/models/JournalEntry.ts (modified)
✅ src/dto/solution.ts

Repositories:
✅ src/repositories/solution/SolutionRepository.ts
✅ src/repositories/solution/AwsRdsSolutionRepository.ts
✅ src/repositories/solution/index.ts
✅ src/repositories/journal/JournalRepository.ts (modified)
✅ src/repositories/journal/AwsRdsJournalRepository.ts (modified)

Services:
✅ src/services/both-crews/BothCrewsService.ts
✅ src/services/both-crews/index.ts
✅ src/services/scheduler/CrewSchedulerService.ts (modified)

API Routes:
✅ src/app/api/solutions/route.ts
✅ src/app/api/solutions/[id]/route.ts

Configuration:
✅ env.example (updated)
```

## Setup Instructions

### 1. Run Database Migrations

```bash
# Run the solutions migrations
npx tsx src/lib/scripts/run-solutions-migrations.ts
```

This will:
- Add the `is_processed_for_solutions` column to `journal_entries`
- Create the `solutions` table

### 2. Configure Environment Variables

Add to your `.env` file:

```env
BOTH_CREWS_API_URL=http://localhost:8000/api/v1/both-crews
```

### 3. Start the Scheduler

The scheduler automatically processes both the crew API and both-crews API when it runs.

**Start the scheduler:**
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 60}'
```

**Run manually for testing:**
```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

## API Endpoints

### 1. Get Solutions

**GET** `/api/solutions`

Retrieve solutions with optional filters.

**Query Parameters:**
- `userUid` (optional) - Filter by user UID
- `entryDate` (optional) - Filter by specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter by start date
- `endDate` (optional) - Filter by end date
- `limit` (optional, default: 100) - Limit results
- `offset` (optional, default: 0) - Offset for pagination

**Example:**
```bash
# Get all solutions for a user
curl "http://localhost:3000/api/solutions?userUid=abc123"

# Get solutions for a specific date
curl "http://localhost:3000/api/solutions?entryDate=2025-11-08"

# Get solutions in a date range
curl "http://localhost:3000/api/solutions?userUid=abc123&startDate=2025-11-01&endDate=2025-11-30"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userUid": "abc123",
      "entryDate": "2025-11-08T00:00:00.000Z",
      "journalEntryId": 45,
      "solution": {
        // API response data
      },
      "createdAt": "2025-11-08T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. Get Single Solution

**GET** `/api/solutions/[id]`

Retrieve a specific solution by ID.

**Example:**
```bash
curl "http://localhost:3000/api/solutions/1"
```

### 3. Delete Solution

**DELETE** `/api/solutions/[id]`

Delete a solution by ID.

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/solutions/1"
```

## How the Processing Flow Works

### Step 1: User Creates/Updates Journal Entry

```typescript
// User saves journal entry via /api/journal
{
  "userUid": "abc123",
  "entryDate": "2025-11-08",
  "content": "## Auto Journal Entry **Q1:** ..."
}

// Database: is_processed_for_solutions = false
```

### Step 2: Scheduler Runs

```typescript
// When scheduler executes (via run-now or scheduled interval)
1. Process crew API for all users (existing functionality)
2. Process both-crews API:
   - Get unprocessed entries for today
   - For each entry:
     - Send to both-crews API
     - Save solution
     - Mark as processed
```

### Step 3: Solution Saved

```typescript
// Solution saved in database
{
  "id": 1,
  "userUid": "abc123",
  "entryDate": "2025-11-08",
  "journalEntryId": 45,
  "solution": { /* API response */ },
  "createdAt": "2025-11-08T10:30:00.000Z"
}

// Journal entry: is_processed_for_solutions = true
```

### Step 4: User Updates Entry (Re-processing)

```typescript
// User updates journal entry
{
  "content": "## Auto Journal Entry **Q1:** Updated answer..."
}

// Database: is_processed_for_solutions = false (auto-reset)

// Next scheduler run:
// - Detects entry as unprocessed
// - Re-processes it
// - Creates NEW solution in database (old solution preserved)
```

## Processing Logic

### BothCrewsService

Located in `src/services/both-crews/BothCrewsService.ts`

**Key Methods:**
- `processTodayEntries()`: Main processing method called by scheduler
  - Gets unprocessed entries for current day
  - Sends each to both-crews API
  - Saves solutions
  - Marks entries as processed

**Features:**
- ✅ Singleton pattern for global service management
- ✅ Configurable API URL via environment variables
- ✅ Comprehensive error handling and logging
- ✅ Processes only unprocessed entries
- ✅ 60-second timeout for API calls
- ✅ Graceful handling of individual entry failures

### Integration with Scheduler

The `CrewSchedulerService` automatically calls `bothCrewsService.processTodayEntries()` after processing users:

```typescript
// In CrewSchedulerService.runScheduledTask()
console.log('🔄 Starting both-crews processing for journal entries...');
await bothCrewsService.processTodayEntries();
console.log('✅ Both-crews processing completed');
```

## Example Workflow

### Day 1: Create Journal Entry
```bash
# User creates journal entry for 2025-11-08
POST /api/journal
{
  "userUid": "user123",
  "entryDate": "2025-11-08",
  "content": "## Auto Journal Entry **Q1:** ..."
}
# Result: is_processed_for_solutions = false
```

### Day 1: Scheduler Runs
```bash
# Scheduler processes the entry
POST /api/scheduler { "action": "run-now" }

# Logs:
# 🔄 Processing journal entry 45 for user user123...
# ✅ Processed entry 45 and created solution 1
```

### Day 1: Query Solution
```bash
# Get the solution
GET /api/solutions?userUid=user123&entryDate=2025-11-08

# Response:
{
  "success": true,
  "data": [{
    "id": 1,
    "journalEntryId": 45,
    "solution": { /* API response */ }
  }]
}
```

### Day 2: User Updates Entry
```bash
# User edits the journal entry
POST /api/journal
{
  "userUid": "user123",
  "entryDate": "2025-11-08",
  "content": "## Auto Journal Entry **Q1:** Updated..."
}
# Result: is_processed_for_solutions = false (reset)
```

### Day 2: Scheduler Re-processes
```bash
# Scheduler detects the update and re-processes
POST /api/scheduler { "action": "run-now" }

# Creates new solution (ID: 2) for the same journal entry
```

### Day 2: Query All Solutions for Entry
```bash
# Get all solutions for the journal entry
GET /api/solutions?userUid=user123&entryDate=2025-11-08

# Response: Shows both solution 1 (original) and solution 2 (after update)
{
  "success": true,
  "data": [
    { "id": 2, "journalEntryId": 45, "createdAt": "2025-11-09..." },
    { "id": 1, "journalEntryId": 45, "createdAt": "2025-11-08..." }
  ]
}
```

## Testing

### 1. Test Manual Processing

```bash
# Create a journal entry for today
curl -X POST http://localhost:3000/api/journal \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "test-user",
    "entryDate": "2025-11-08",
    "content": "## Auto Journal Entry **Q1:** Test..."
  }'

# Run scheduler manually
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'

# Check logs for:
# ✅ Processed entry X and created solution Y

# Query the solution
curl "http://localhost:3000/api/solutions?userUid=test-user"
```

### 2. Test Re-processing on Update

```bash
# Update the same journal entry
curl -X POST http://localhost:3000/api/journal \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "test-user",
    "entryDate": "2025-11-08",
    "content": "## Auto Journal Entry **Q1:** Updated test..."
  }'

# Run scheduler again
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'

# Query solutions - should see 2 entries
curl "http://localhost:3000/api/solutions?userUid=test-user"
```

## Troubleshooting

### No Entries Being Processed?

1. **Check journal entries exist for today:**
   ```sql
   SELECT * FROM journal_entries WHERE entry_date = CURRENT_DATE;
   ```

2. **Check if already processed:**
   ```sql
   SELECT * FROM journal_entries 
   WHERE entry_date = CURRENT_DATE 
   AND is_processed_for_solutions = false;
   ```

3. **Check API URL:**
   - Verify `BOTH_CREWS_API_URL` in `.env`
   - Default: `http://localhost:8000/api/v1/both-crews`

### API Errors?

- Check the both-crews API is running on port 8000
- Verify the API endpoint accepts POST requests
- Check request body format matches API expectations

### Multiple Solutions for Same Entry?

This is expected behavior! When a user updates their journal entry, a new solution is created. This preserves the history of solutions over time.

## Benefits

✅ **Automatic Processing**: No manual intervention needed  
✅ **Smart Re-processing**: Detects updates and re-processes automatically  
✅ **Scalable**: Processes multiple users and entries efficiently  
✅ **Historical Data**: Preserves all solutions for audit and analysis  
✅ **Error Handling**: Graceful failure handling for individual entries  
✅ **Query Flexibility**: Rich filtering options for retrieving solutions  
✅ **Clean Architecture**: Follows repository pattern for maintainability  

## Summary

The both-crews API integration provides a seamless way to automatically process journal entries and generate solutions. It integrates perfectly with the existing scheduler system and handles edge cases like entry updates gracefully. The solution storage in a dedicated table makes it easy to retrieve and analyze solutions for any user or date range.

