# Journal Questions Schema Update - Quick Reference

## What Changed?

**Old:** One set of questions for all users  
**New:** Each user has their own question sets per date

## New Schema

```sql
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,         -- User identifier
  entry_date DATE NOT NULL,       -- Date for this question set
  questions JSONB NOT NULL,       -- Array of questions
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_uid, entry_date)    -- One set per user per date
);
```

## Setup

### 1. Drop Old Table (if migrated previously)

```bash
# Connect to your database
psql -d your_database

# Drop old table
DROP TABLE IF EXISTS journal_questions CASCADE;
```

### 2. Run Migration

```bash
npm run db:migrate:journal-questions
```

## API Changes

### Old API

```javascript
// Old: Get all questions (no user/date)
GET /api/journal-questions
```

### New API

```javascript
// New: Get questions for user and date (auto-creates if not exists)
GET /api/journal-questions?userUid=user123&entryDate=2025-01-15

// Create/update question set
POST /api/journal-questions
Body: { userUid, entryDate, questions }

// Get default template
GET /api/journal-questions/default
```

## Frontend Changes

The frontend **automatically**:
- Loads questions for current user and selected date
- Creates question sets on-demand using default template
- No manual configuration needed

## Migration Steps

1. **Backup** (if you have existing data):
   ```bash
   pg_dump -t journal_questions your_database > backup.sql
   ```

2. **Drop old table**:
   ```sql
   DROP TABLE IF EXISTS journal_questions CASCADE;
   ```

3. **Run migration**:
   ```bash
   npm run db:migrate:journal-questions
   ```

4. **Test**:
   ```bash
   npm run dev
   # Open journaling screen
   # Questions should load automatically
   ```

## Key Features

✅ **Auto-Creation** - Questions created automatically when user visits a date  
✅ **Default Template** - New users get default questions  
✅ **Per-User Customization** - Each user can have different questions  
✅ **Date-Based** - Questions can change over time  
✅ **Backward Compatible** - Existing journal entries still work  

## Example Usage

```javascript
// Frontend automatically does this:
const questions = await fetch(
  `/api/journal-questions?userUid=${user.uid}&entryDate=${date}`
)

// If first time visiting this date:
// 1. API fetches default template
// 2. Creates new question set for user + date
// 3. Returns questions

// If already exists:
// Returns existing questions
```

## Verification

```sql
-- Check default template exists
SELECT * FROM journal_questions WHERE user_uid = 'default_template';

-- Check user question sets
SELECT user_uid, entry_date, jsonb_array_length(questions) as question_count
FROM journal_questions
ORDER BY created_at DESC;
```

## Troubleshooting

**Q: Questions not showing?**  
A: Check that migration ran successfully and default template exists

**Q: API error 400 "userUid is required"?**  
A: Frontend needs user authentication - make sure user is logged in

**Q: Want to reset to default questions?**  
A: Delete the row for that user+date, will auto-recreate from template

```sql
DELETE FROM journal_questions 
WHERE user_uid = 'user123' AND entry_date = '2025-01-15';
```

## Documentation

See `JOURNAL_QUESTIONS_USER_SPECIFIC_GUIDE.md` for complete documentation.

