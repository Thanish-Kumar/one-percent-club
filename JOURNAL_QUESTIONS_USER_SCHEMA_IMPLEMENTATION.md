# Journal Questions User-Specific Schema - Implementation Summary

## ✅ Implementation Complete

Successfully updated the journal questions feature to use a **user-specific, date-based schema**. Each user now has their own question sets per date, stored as JSON.

## Schema Transformation

### Before ❌
```sql
-- Global questions for all users
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT,
  options JSONB,
  question_order INT,
  is_active BOOLEAN
);
```

### After ✅
```sql
-- User-specific question sets per date
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  entry_date DATE NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_uid, entry_date)
);
```

## What Changed

### 1. Database Schema ✅
**File:** `src/lib/migrations/create_journal_questions_table.sql`

- Changed from individual question rows to question sets
- Added `user_uid` column for user identification
- Added `entry_date` column for date-specific questions
- Changed `questions` to JSONB array containing all questions
- Added unique constraint on `(user_uid, entry_date)`
- Added indexes for performance
- Includes default template with `user_uid = 'default_template'`

### 2. Model Updates ✅
**File:** `src/models/JournalQuestion.ts`

**Old:**
```typescript
interface JournalQuestion {
  id: number
  questionText: string
  options: string[]
  questionOrder: number
  isActive: boolean
}
```

**New:**
```typescript
interface Question {
  id: number
  question: string
  options: string[]
}

interface JournalQuestionSet {
  id: number
  userUid: string
  entryDate: string
  questions: Question[]
  createdAt: Date
  updatedAt: Date
}
```

### 3. Repository Updates ✅
**File:** `src/repositories/journal-question/`

**New Methods:**
- `getQuestionSetByUserAndDate(userUid, entryDate)` - Get specific question set
- `getQuestionSetsByUser(userUid)` - Get all sets for a user
- `getDefaultQuestionSet()` - Get default template
- `createQuestionSet(data)` - Create new question set
- `updateQuestionSet(userUid, entryDate, data)` - Update existing set
- `deleteQuestionSet(userUid, entryDate)` - Delete set
- `getOrCreateQuestionSet(userUid, entryDate)` - **Auto-create if not exists**

### 4. API Endpoints ✅
**Files:** `src/app/api/journal-questions/`

**Updated:**

#### GET `/api/journal-questions`
```javascript
// Old: Get all questions (global)
GET /api/journal-questions

// New: Get or create for user + date
GET /api/journal-questions?userUid=user123&entryDate=2025-01-15
```

**Response:**
```json
{
  "success": true,
  "questions": [
    { "id": 1, "question": "...", "options": ["..."] }
  ]
}
```

#### POST `/api/journal-questions`
Create or update question set:
```javascript
POST /api/journal-questions
Body: {
  userUid: "user123",
  entryDate: "2025-01-15",
  questions: [...]
}
```

#### GET `/api/journal-questions/default`
Get default template:
```javascript
GET /api/journal-questions/default
```

**Removed:**
- `/api/journal-questions/[id]` endpoints (replaced with user+date queries)

### 5. Frontend Updates ✅
**File:** `src/components/JournalingScreen.tsx`

**Changed:**
```typescript
// Old: Load global questions once
const loadQuestions = async () => {
  const response = await fetch('/api/journal-questions')
  // ...
}

// New: Load user-specific questions for selected date
const loadQuestions = async (date: Date) => {
  if (!user) return
  const dateISO = formatDateToISO(date)
  const response = await fetch(
    `/api/journal-questions?userUid=${user.uid}&entryDate=${dateISO}`
  )
  // ...
}
```

**Updated useEffect:**
```typescript
// Old: Load questions once on mount
useEffect(() => {
  loadQuestions()
}, [])

// New: Reload questions when date or user changes
useEffect(() => {
  if (user) {
    loadQuestions(selectedDate)
    loadEntry(selectedDate)
    loadEntryDates(selectedDate)
  }
}, [selectedDate, user])
```

### 6. Documentation ✅

**Created:**
- `JOURNAL_QUESTIONS_USER_SPECIFIC_GUIDE.md` - Complete guide
- `JOURNAL_QUESTIONS_SCHEMA_UPDATE.md` - Quick migration reference

**Updated:**
- `README.md` - Updated documentation links

## Key Features

### Auto-Creation 🎯
```javascript
// Frontend requests questions for date
GET /api/journal-questions?userUid=user123&entryDate=2025-01-15

// Backend automatically:
// 1. Checks if question set exists
// 2. If NO → Gets default template
// 3. Creates new question set
// 4. Returns questions

// User gets questions without any manual setup!
```

### Default Template 📋
```sql
-- Default template in database
user_uid: 'default_template'
entry_date: CURRENT_DATE
questions: [10 default questions in JSON]

-- Used when creating question sets for new users/dates
```

### Per-User Customization 🎨
```javascript
// Each user can have different questions
await fetch('/api/journal-questions', {
  method: 'POST',
  body: JSON.stringify({
    userUid: 'user123',
    entryDate: '2025-01-15',
    questions: [
      { id: 1, question: "Custom question?", options: [...] }
    ]
  })
})
```

### Date-Based Evolution 📅
```sql
-- User can have different questions on different dates
user_uid: 'user123', entry_date: '2025-01-15' → [Questions Set A]
user_uid: 'user123', entry_date: '2025-01-16' → [Questions Set B]
user_uid: 'user123', entry_date: '2025-01-17' → [Questions Set C]
```

## Migration Steps

### If You Previously Ran the Old Migration

1. **Drop the old table:**
   ```bash
   psql -d your_database -c "DROP TABLE IF EXISTS journal_questions CASCADE;"
   ```

2. **Run the new migration:**
   ```bash
   npm run db:migrate:journal-questions
   ```

3. **Verify:**
   ```bash
   # Start app
   npm run dev
   
   # Open journaling screen
   # Questions should load automatically
   ```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│ User opens journaling screen for date           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ loadQuestions(selectedDate)                     │
│ GET /api/journal-questions?userUid=...&date=... │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Repository.getOrCreateQuestionSet()             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ Set exists?  │  │ Set not found    │
│ Return it    │  │ Get default      │
└──────┬───────┘  │ Create new set   │
       │          │ Return new       │
       │          └────────┬─────────┘
       │                   │
       └────────┬──────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ Frontend renders questions                      │
└─────────────────────────────────────────────────┘
```

## Benefits

✅ **User-Specific** - Each user has their own questions  
✅ **Date-Based** - Questions can evolve over time  
✅ **Auto-Creation** - No manual setup required  
✅ **Default Template** - Consistent starting point  
✅ **Flexible** - Easy to customize per user  
✅ **Performant** - Indexed queries  
✅ **Clean** - Follows clean architecture  

## Testing Checklist

- [x] Migration runs successfully
- [x] Default template inserted
- [x] API endpoints work with user+date
- [x] Frontend loads questions per date
- [x] Auto-creation works
- [x] Questions display correctly
- [x] Answers save correctly
- [x] Date navigation updates questions
- [x] No TypeScript errors
- [x] No linter errors

## Database Queries

### View all question sets
```sql
SELECT user_uid, entry_date, 
       jsonb_array_length(questions) as question_count
FROM journal_questions
ORDER BY created_at DESC;
```

### View specific user's sets
```sql
SELECT * FROM journal_questions 
WHERE user_uid = 'user123' 
ORDER BY entry_date DESC;
```

### View default template
```sql
SELECT * FROM journal_questions 
WHERE user_uid = 'default_template';
```

### Delete user's question set (force recreation)
```sql
DELETE FROM journal_questions 
WHERE user_uid = 'user123' AND entry_date = '2025-01-15';
-- Next API call will auto-create from template
```

## Performance

- **Indexes** on `user_uid`, `entry_date`, and `(user_uid, entry_date)`
- **JSONB** for efficient JSON storage and querying
- **Unique constraint** prevents duplicate entries
- **On-demand creation** reduces unnecessary database rows

## Architecture

Maintains **Clean Architecture** principles:

1. **Domain Layer** - `JournalQuestionSet` model
2. **Data Layer** - Repository with interface
3. **Use Case Layer** - API routes
4. **Presentation Layer** - React component

## Future Enhancements

Potential additions:
- ✨ Question versioning
- ✨ Question sharing between users
- ✨ Question templates/presets
- ✨ Question categories
- ✨ Conditional questions
- ✨ Question analytics

## Summary

✅ **Schema updated from global to user-specific**  
✅ **Auto-creation from default template**  
✅ **Date-based flexibility**  
✅ **Clean architecture maintained**  
✅ **Fully functional and tested**  
✅ **Production ready**  

The journal questions feature now supports **personalized, date-based question sets** for each user!

