# Both-Crews API Integration

## 🎉 Status: FULLY IMPLEMENTED ✅

The both-crews API integration for processing journal entries and generating solutions is **complete and production-ready**.

## What Was Implemented

### 1. ✅ New API Call Integration
- **Endpoint:** `POST http://localhost:8000/api/v1/both-crews`
- **Format:** JSON body with `qna_pairs` key
- **Service:** `BothCrewsService` handles all API communication

### 2. ✅ Scheduler Integration
- Automatically runs when scheduler executes
- Processes journal entries after crew API processing
- No manual intervention required

### 3. ✅ Smart Request Construction
- Fetches unprocessed journal entries for current day
- Uses journal entry `content` column as-is for `qna_pairs`
- Sends request to both-crews API
- Saves response in `solutions` table

### 4. ✅ Processing Tracking
- New column: `is_processed_for_solutions` in `journal_entries` table
- Default: `FALSE` (not processed)
- Set to `TRUE` after successful processing
- Only unprocessed entries are sent to API

### 5. ✅ Automatic Re-processing
- When user updates journal entry, flag resets to `FALSE`
- Next scheduler run detects change and re-processes
- New solution created as separate row (history preserved)

### 6. ✅ Solutions Storage
- New table: `solutions`
- Columns: `id`, `user_uid`, `entry_date`, `journal_entry_id`, `solution` (JSONB), `created_at`
- Foreign keys to users and journal_entries
- Optimized indexes for fast queries

### 7. ✅ Query API
- `GET /api/solutions` - List solutions with filters
- `GET /api/solutions/[id]` - Get specific solution
- `DELETE /api/solutions/[id]` - Delete solution

## Quick Start

### 1. Configure Environment
```env
# Add to your .env file
BOTH_CREWS_API_URL=http://localhost:8000/api/v1/both-crews
```

### 2. Run Migrations
```bash
npm run db:migrate:solutions
```

### 3. Start Using
```bash
# The integration runs automatically with the scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  User creates/updates journal entry                          │
│  → is_processed_for_solutions = FALSE                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Scheduler runs (POST /api/scheduler)                        │
│  → CrewSchedulerService.runScheduledTask()                   │
│    ├─ Process users (existing functionality)                 │
│    └─ Process journal entries (NEW)                          │
│       └─ BothCrewsService.processTodayEntries()              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Get unprocessed entries for today                           │
│  → WHERE is_processed_for_solutions = FALSE                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  For each unprocessed entry:                                 │
│  1. POST to both-crews API                                   │
│     Body: { "qna_pairs": entry.content }                     │
│  2. Save response to solutions table                         │
│  3. Mark entry as processed (is_processed_for_solutions=TRUE)│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Solution saved!                                             │
│  → Query via /api/solutions?userUid=X                        │
└─────────────────────────────────────────────────────────────┘
```

## API Request Example

**What gets sent to both-crews API:**

```json
POST http://localhost:8000/api/v1/both-crews
Content-Type: application/json

{
  "qna_pairs": "## Auto Journal Entry **Q1:** What is the biggest challenge you're currently facing in capturing the Indian healthcare insurance market? Answer: Regulatory challenges **Q2:** What is your primary focus area for growth in the healthcare insurance market?Answer: Expanding product portfolio **Q3:** What forms of marketing strategy do you currently use for visibility and growth? Answer: Digital marketing **Q4:** What do you consider paramount in achieving rapid growth? Answer: Quick customer acquisition **Q5:** How do you differentiate your healthcare insurance products from that of your competitors? Answer: Coverage **Q6:** What is your target demographic for new policyholders Answer: Middle-aged adults **Q7:** What does your customer retention strategy look like currently? Answer: Not answered **Q8:** What areas do you think technology can be leveraged more for better outcomes? Answer: Customer acquisition **Q9:** What is your current rate of customer attrition and what strategies are being used to reduce it? Answer: Policy pricing optimization **Q10:** What are your company's financial goals for the next fiscal year? Answer: Increase market share"
}
```

## Database Schema

### Modified: `journal_entries`
```sql
-- New column added
is_processed_for_solutions BOOLEAN DEFAULT FALSE

-- Automatically resets to FALSE when entry is updated
```

### New: `solutions`
```sql
CREATE TABLE solutions (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    entry_date DATE NOT NULL,
    journal_entry_id INTEGER NOT NULL,
    solution JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Query Solutions

### Get all solutions for a user
```bash
curl "http://localhost:3000/api/solutions?userUid=abc123"
```

### Get solutions for a date
```bash
curl "http://localhost:3000/api/solutions?entryDate=2025-11-08"
```

### Get solutions in date range
```bash
curl "http://localhost:3000/api/solutions?userUid=abc123&startDate=2025-11-01&endDate=2025-11-30"
```

### Get specific solution
```bash
curl "http://localhost:3000/api/solutions/1"
```

### Delete solution
```bash
curl -X DELETE "http://localhost:3000/api/solutions/1"
```

## Re-processing Example

### Day 1: Original Entry
```
Journal Entry Created → is_processed_for_solutions = false
Scheduler Runs → Entry processed → Solution #1 created → is_processed_for_solutions = true
```

### Day 2: User Updates Entry
```
Journal Entry Updated → is_processed_for_solutions = false (auto-reset)
Scheduler Runs → Entry re-processed → Solution #2 created
Database: Has both Solution #1 and Solution #2 (history preserved)
```

## Files Structure

```
src/
├── lib/
│   ├── migrations/
│   │   ├── add_processed_column_to_journal_entries.sql
│   │   └── create_solutions_table.sql
│   └── scripts/
│       └── run-solutions-migrations.ts
├── models/
│   ├── Solution.ts
│   └── JournalEntry.ts (updated)
├── dto/
│   └── solution.ts
├── repositories/
│   ├── solution/
│   │   ├── SolutionRepository.ts
│   │   ├── AwsRdsSolutionRepository.ts
│   │   └── index.ts
│   └── journal/ (updated)
│       ├── JournalRepository.ts
│       └── AwsRdsJournalRepository.ts
├── services/
│   ├── both-crews/
│   │   ├── BothCrewsService.ts
│   │   └── index.ts
│   └── scheduler/
│       └── CrewSchedulerService.ts (updated)
└── app/
    └── api/
        └── solutions/
            ├── route.ts
            └── [id]/
                └── route.ts
```

## Documentation

📖 **BOTH_CREWS_SETUP_CHECKLIST.md** - Step-by-step setup guide  
📖 **BOTH_CREWS_QUICK_START.md** - Quick reference  
📖 **BOTH_CREWS_INTEGRATION_GUIDE.md** - Comprehensive documentation  
📖 **BOTH_CREWS_IMPLEMENTATION_SUMMARY.md** - Technical details  
📖 **BOTH_CREWS_README.md** - This file

## Key Features

✅ **Automatic Processing** - No manual intervention needed  
✅ **Smart Re-processing** - Detects updates and re-processes  
✅ **History Preservation** - Multiple solutions per entry  
✅ **Error Handling** - Individual failures don't stop processing  
✅ **Scalable** - Processes multiple users efficiently  
✅ **Queryable** - Rich API for retrieving solutions  
✅ **Clean Architecture** - Repository pattern, service layer, DTOs  

## Next Steps

1. ✅ **Configure `.env`** with database credentials and both-crews API URL
2. ✅ **Run migrations** via `npm run db:migrate:solutions`
3. ✅ **Test** by running scheduler manually
4. ✅ **Query solutions** via `/api/solutions` endpoints

## Support

- **BOTH_CREWS_ASYNC_PROCESSING.md** - Async/background processing architecture
- **BOTH_CREWS_INTEGRATION_GUIDE.md** - Comprehensive guide
- **BOTH_CREWS_SETUP_CHECKLIST.md** - Setup instructions
- **BOTH_CREWS_IMPLEMENTATION_SUMMARY.md** - Technical details

## 📊 Monitor Queue Status

```bash
# Check how many entries are waiting to be processed
curl "http://localhost:3000/api/both-crews/status"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queueSize": 5,
    "isProcessing": true,
    "message": "5 entries waiting to be processed"
  }
}
```

---

**Implementation Status:** ✅ **COMPLETE AND READY TO USE**

All requirements have been met and the system is production-ready. Simply complete the setup steps and start using the integration!

