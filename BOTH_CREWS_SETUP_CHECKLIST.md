# Both-Crews Integration - Setup Checklist

## ✅ Implementation Complete!

All code has been implemented and is ready to use. Follow these steps to set up and start using the both-crews integration.

## 📋 Setup Steps

### Step 1: Configure Database Credentials ⚙️

Make sure your `.env` file has the correct database credentials:

```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=oneprocentclub
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SSL=true
```

### Step 2: Add Both-Crews API URL ⚙️

Add this to your `.env` file:

```env
BOTH_CREWS_API_URL=http://localhost:8000/api/v1/both-crews
```

### Step 3: Run Database Migrations 🗄️

```bash
npm run db:migrate:solutions
```

This will:
- ✅ Add `is_processed_for_solutions` column to `journal_entries` table
- ✅ Create `solutions` table with proper indexes and foreign keys

### Step 4: Verify Setup ✔️

Check that the migrations ran successfully:

```sql
-- Check journal_entries has new column
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
AND column_name = 'is_processed_for_solutions';

-- Check solutions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'solutions';
```

### Step 5: Start Using! 🚀

The both-crews integration is now ready! It will automatically run when the scheduler executes:

```bash
# Start the scheduler (runs every hour)
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 60}'

# Or run manually for testing
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

## 🎯 What Happens When Scheduler Runs

```
1. Processes users for crew API (existing)
   ↓
2. Processes journal entries for solutions (NEW)
   ↓
   ├─ Gets all unprocessed entries for today
   │  (is_processed_for_solutions = false)
   │
   ├─ For each entry:
   │  ├─ Sends content to both-crews API
   │  ├─ Saves response to solutions table
   │  └─ Marks entry as processed
   │
   └─ Done!
```

## 📊 Query Solutions

```bash
# Get all solutions for a user
curl "http://localhost:3000/api/solutions?userUid=YOUR_USER_ID"

# Get solutions for a specific date
curl "http://localhost:3000/api/solutions?entryDate=2025-11-08"

# Get a specific solution
curl "http://localhost:3000/api/solutions/1"
```

## 🔄 Re-processing on Updates

When a user updates their journal entry:
1. The `is_processed_for_solutions` flag automatically resets to `false`
2. Next scheduler run detects the change
3. Entry is re-processed and new solution is created
4. Old solution remains in database (history preserved)

## 📁 Files Created

All these files have been created and are ready:

### Database
- ✅ `src/lib/migrations/add_processed_column_to_journal_entries.sql`
- ✅ `src/lib/migrations/create_solutions_table.sql`
- ✅ `src/lib/scripts/run-solutions-migrations.ts`

### Models & DTOs
- ✅ `src/models/Solution.ts`
- ✅ `src/models/JournalEntry.ts` (updated)
- ✅ `src/dto/solution.ts`

### Repositories
- ✅ `src/repositories/solution/SolutionRepository.ts`
- ✅ `src/repositories/solution/AwsRdsSolutionRepository.ts`
- ✅ `src/repositories/solution/index.ts`
- ✅ `src/repositories/journal/JournalRepository.ts` (updated)
- ✅ `src/repositories/journal/AwsRdsJournalRepository.ts` (updated)

### Services
- ✅ `src/services/both-crews/BothCrewsService.ts`
- ✅ `src/services/both-crews/index.ts`
- ✅ `src/services/scheduler/CrewSchedulerService.ts` (updated)

### API Routes
- ✅ `src/app/api/solutions/route.ts`
- ✅ `src/app/api/solutions/[id]/route.ts`

### Configuration
- ✅ `env.example` (updated)
- ✅ `package.json` (added migration script)

### Documentation
- ✅ `BOTH_CREWS_INTEGRATION_GUIDE.md` - Full documentation
- ✅ `BOTH_CREWS_QUICK_START.md` - Quick reference
- ✅ `BOTH_CREWS_IMPLEMENTATION_SUMMARY.md` - Technical details
- ✅ `BOTH_CREWS_SETUP_CHECKLIST.md` - This file

## 🧪 Testing the Integration

### 1. Create a Journal Entry

```bash
curl -X POST http://localhost:3000/api/journal \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "test-user",
    "entryDate": "2025-11-08",
    "content": "## Auto Journal Entry **Q1:** What is your biggest challenge? Answer: Scaling the business **Q2:** What is your goal? Answer: Rapid growth"
  }'
```

### 2. Run the Scheduler

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

### 3. Check the Logs

Look for these messages:
```
🔄 Starting both-crews processing for journal entries...
🔄 Processing journal entry X for user test-user...
✅ Processed entry X and created solution Y
✅ Both-crews processing completed
```

### 4. Query the Solution

```bash
curl "http://localhost:3000/api/solutions?userUid=test-user"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userUid": "test-user",
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

## 🎊 You're All Set!

Once you complete the setup steps above, the both-crews integration will be fully operational. Journal entries will be automatically processed when the scheduler runs, and you can query solutions via the API anytime.

## 📚 Need Help?

- **Quick Start:** See `BOTH_CREWS_QUICK_START.md`
- **Full Guide:** See `BOTH_CREWS_INTEGRATION_GUIDE.md`
- **Technical Details:** See `BOTH_CREWS_IMPLEMENTATION_SUMMARY.md`

## 🔧 Troubleshooting

### Migration Fails
- Check database credentials in `.env`
- Ensure database is accessible
- Verify PostgreSQL version compatibility

### No Entries Being Processed
- Ensure journal entries exist for today
- Check `is_processed_for_solutions` flag
- Verify `BOTH_CREWS_API_URL` is correct

### API Errors
- Ensure both-crews API is running on port 8000
- Check API endpoint accepts POST requests
- Verify request body format

---

**Status:** ✅ **IMPLEMENTATION COMPLETE - READY TO SET UP**



