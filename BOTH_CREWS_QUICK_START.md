# Both-Crews API Integration - Quick Start

## 🚀 Setup in 3 Steps

### 1. Run Migrations
```bash
npx tsx src/lib/scripts/run-solutions-migrations.ts
```

This creates:
- ✅ `is_processed_for_solutions` column in `journal_entries` table
- ✅ `solutions` table to store API responses

### 2. Configure Environment
Add to your `.env` file:
```env
BOTH_CREWS_API_URL=http://localhost:8000/api/v1/both-crews
```

### 3. Start Using
The both-crews processing runs automatically when the scheduler runs:

```bash
# Start scheduler (runs every hour)
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 60}'

# Or run manually for testing
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
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

## 🔄 How It Works

1. **User creates/updates journal entry** → `is_processed_for_solutions = false`
2. **Scheduler runs** → Queues unprocessed entries (instant, non-blocking)
3. **Background processor** → Picks entries one at a time, sends to both-crews API (10-min timeout)
4. **Solution saved** → Stored in `solutions` table, entry marked as processed
5. **User updates entry** → Flag resets to `false`, gets re-queued next run

**⚡ Non-Blocking:** App remains responsive! Users can continue working while processing happens in background.

## 📝 What Gets Sent to API

**Request to:** `POST http://localhost:8000/api/v1/both-crews`

**Body:**
```json
{
  "qna_pairs": "## Auto Journal Entry **Q1:** What is the biggest challenge..."
}
```

The `qna_pairs` value is the exact `content` from the journal entry.

## 🎯 Key Features

✅ **Non-blocking** - Users can use app while processing happens  
✅ **Sequential processing** - One entry at a time, no race conditions  
✅ **10-minute timeout** - Extended time for API calls  
✅ **Automatic retries** - Up to 3 attempts on failure  
✅ **Smart re-processing** - Detects updates and re-processes  
✅ **Queue monitoring** - Check status via `/api/both-crews/status`  
✅ **Query API** - Retrieve solutions by user, date, or ID  

## 📚 Need More Details?

- **BOTH_CREWS_ASYNC_PROCESSING.md** - Async processing architecture
- **BOTH_CREWS_INTEGRATION_GUIDE.md** - Full guide

## 📊 Monitor Queue

```bash
# Check queue status
curl "http://localhost:3000/api/both-crews/status"
```

## ✅ That's It!

Your both-crews integration is ready to use. Journal entries will automatically be processed when the scheduler runs!

