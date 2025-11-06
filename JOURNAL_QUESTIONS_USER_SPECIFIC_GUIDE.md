# Journal Questions - User-Specific Schema Guide

## Overview

The journal questions feature has been updated to use a **user-specific, date-based schema**. This allows each user to have different question sets for different dates.

## Schema Change

### Old Schema (Global Questions)
```sql
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  question_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  ...
);
```
- One set of questions shared by all users
- Questions managed globally

### New Schema (User-Specific Question Sets)
```sql
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  entry_date DATE NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date_questions UNIQUE(user_uid, entry_date)
);
```
- Each row represents a question set for a specific user on a specific date
- Questions stored as JSON array
- Unique constraint on `(user_uid, entry_date)`

## Benefits of New Schema

✅ **User-Specific Questions** - Different users can have different questions  
✅ **Date-Based Flexibility** - Questions can change over time  
✅ **Custom Question Sets** - Each user can customize their questions  
✅ **Default Template** - New users get default questions automatically  
✅ **No Migration Needed** - Questions created on-demand  

## Database Schema

### Table Structure

```sql
journal_questions (
  id              SERIAL PRIMARY KEY,
  user_uid        TEXT NOT NULL,
  entry_date      DATE NOT NULL,
  questions       JSONB NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_uid, entry_date)
)
```

### Indexes

- `idx_journal_questions_user` - Fast user lookups
- `idx_journal_questions_date` - Fast date lookups
- `idx_journal_questions_user_date` - Fast composite queries

### Question JSON Format

```json
[
  {
    "id": 1,
    "question": "How productive was your day today?",
    "options": ["Very Productive", "Moderately Productive", "Not Productive"]
  },
  {
    "id": 2,
    "question": "How would you rate your energy levels?",
    "options": ["High Energy", "Moderate Energy", "Low Energy"]
  }
]
```

## Setup

### 1. Drop Old Table (if exists)

```sql
DROP TABLE IF EXISTS journal_questions CASCADE;
```

### 2. Run Migration

```bash
npm run db:migrate:journal-questions
```

This will:
- Create the new schema
- Add indexes
- Insert default template with user_uid = 'default_template'

## API Endpoints

### GET `/api/journal-questions`

Fetch or create question set for a user and date.

**Query Parameters:**
- `userUid` (required): User's UID
- `entryDate` (required): ISO date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "How productive was your day today?",
      "options": ["Very Productive", "Moderately Productive", "Not Productive"]
    }
  ]
}
```

**Behavior:**
- If question set exists for user + date: Returns it
- If not exists: Creates new set using default template

**Example:**
```javascript
const response = await fetch(
  '/api/journal-questions?userUid=user123&entryDate=2025-01-15'
)
const data = await response.json()
console.log(data.questions) // Array of questions
```

### POST `/api/journal-questions`

Create or update a question set.

**Request Body:**
```json
{
  "userUid": "user123",
  "entryDate": "2025-01-15",
  "questions": [
    {
      "id": 1,
      "question": "Custom question?",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "questionSet": {
    "id": 1,
    "userUid": "user123",
    "entryDate": "2025-01-15",
    "questions": [...]
  }
}
```

**Behavior:**
- If question set exists: Updates it
- If not exists: Creates new one

### GET `/api/journal-questions/default`

Get the default question template.

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "How productive was your day today?",
      "options": ["Very Productive", "Moderately Productive", "Not Productive"]
    }
  ]
}
```

## Usage Examples

### Load Questions for User and Date

```javascript
// Frontend automatically loads questions for current user and date
const loadQuestions = async (userUid, date) => {
  const dateISO = date.toISOString().split('T')[0]
  const response = await fetch(
    `/api/journal-questions?userUid=${userUid}&entryDate=${dateISO}`
  )
  const data = await response.json()
  return data.questions
}

// Usage
const questions = await loadQuestions('user123', new Date())
```

### Create Custom Question Set

```javascript
const customQuestions = [
  {
    id: 1,
    question: "What was your biggest win today?",
    options: ["Major milestone", "Small progress", "No wins"]
  },
  {
    id: 2,
    question: "What needs improvement?",
    options: ["Time management", "Focus", "Communication"]
  }
]

await fetch('/api/journal-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userUid: 'user123',
    entryDate: '2025-01-15',
    questions: customQuestions
  })
})
```

### Get Default Template

```javascript
const response = await fetch('/api/journal-questions/default')
const data = await response.json()
console.log(data.questions) // Default question template
```

## Frontend Integration

The `JournalingScreen` component automatically:

1. **Loads questions when date changes**
   ```typescript
   useEffect(() => {
     if (user) {
       loadQuestions(selectedDate)
       loadEntry(selectedDate)
       loadEntryDates(selectedDate)
     }
   }, [selectedDate, user])
   ```

2. **Fetches user-specific questions**
   ```typescript
   const loadQuestions = async (date: Date) => {
     if (!user) return
     const dateISO = formatDateToISO(date)
     const response = await fetch(
       `/api/journal-questions?userUid=${user.uid}&entryDate=${dateISO}`
     )
     // ...
   }
   ```

3. **Auto-creates question sets**
   - If user visits a date for the first time, API creates question set from template
   - No manual setup required

## Data Flow

```
User opens journaling screen for date
  ↓
Frontend: loadQuestions(userUid, date)
  ↓
GET /api/journal-questions?userUid=...&entryDate=...
  ↓
Repository: getOrCreateQuestionSet(userUid, date)
  ↓
Check if question set exists
  ├─ YES → Return existing questions
  └─ NO  → Get default template
           Create new question set
           Return new questions
  ↓
Frontend renders questions
  ↓
User answers questions
  ↓
Answers saved to journal_entries table
```

## Default Template

The migration inserts a default template with:
- `user_uid = 'default_template'`
- `entry_date = CURRENT_DATE`
- 10 standard productivity questions

This template is used when creating question sets for new users.

## Customization

### Update Default Template

```sql
UPDATE journal_questions
SET questions = '[
  {
    "id": 1,
    "question": "Your custom question?",
    "options": ["Answer 1", "Answer 2", "Answer 3"]
  }
]'::jsonb
WHERE user_uid = 'default_template';
```

### Create User-Specific Questions

```javascript
await fetch('/api/journal-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userUid: 'specific-user-id',
    entryDate: '2025-01-15',
    questions: [
      { id: 1, question: "Custom question?", options: ["A", "B", "C"] }
    ]
  })
})
```

## Migration from Old Schema

If you have the old schema:

1. **Backup existing data** (if any)
   ```sql
   -- Export existing questions if needed
   COPY journal_questions TO '/tmp/old_questions.csv' WITH CSV HEADER;
   ```

2. **Drop old table**
   ```sql
   DROP TABLE IF EXISTS journal_questions CASCADE;
   ```

3. **Run new migration**
   ```bash
   npm run db:migrate:journal-questions
   ```

## Querying Data

### Get all question sets for a user

```sql
SELECT * FROM journal_questions 
WHERE user_uid = 'user123' 
ORDER BY entry_date DESC;
```

### Get question set for specific date

```sql
SELECT * FROM journal_questions 
WHERE user_uid = 'user123' AND entry_date = '2025-01-15';
```

### Count users with custom questions

```sql
SELECT COUNT(DISTINCT user_uid) 
FROM journal_questions 
WHERE user_uid != 'default_template';
```

## Best Practices

1. **Don't delete the default template** - It's needed for new users

2. **Use ISO date format** - Always use `YYYY-MM-DD` for dates

3. **Maintain question IDs** - Keep IDs consistent when updating questions

4. **Validate JSON structure** - Ensure questions array has correct format

5. **Handle missing questions gracefully** - API auto-creates if not found

## Troubleshooting

### Questions not loading?

Check:
1. User is authenticated (user.uid exists)
2. Date is valid ISO format
3. Database connection is working
4. Default template exists in database

### API returns error?

```javascript
// Check response
const response = await fetch('/api/journal-questions?userUid=...&entryDate=...')
const data = await response.json()
if (!data.success) {
  console.error(data.error)
}
```

### Reset to default questions?

```sql
-- Delete user's custom questions
DELETE FROM journal_questions 
WHERE user_uid = 'user123' AND entry_date = '2025-01-15';

-- Next API call will auto-create from template
```

## Performance Considerations

- **Indexes** optimize user+date queries
- **JSONB** allows efficient JSON storage and querying
- **On-demand creation** prevents unnecessary database entries
- **Unique constraint** prevents duplicate question sets

## Future Enhancements

Potential additions:
- Question versioning
- Question sharing between users
- Question categories/tags
- Conditional questions based on previous answers
- Question analytics

## Related Files

- **Migration**: `src/lib/migrations/create_journal_questions_table.sql`
- **Model**: `src/models/JournalQuestion.ts`
- **Repository**: `src/repositories/journal-question/`
- **API**: `src/app/api/journal-questions/`
- **Component**: `src/components/JournalingScreen.tsx`

## Summary

The new user-specific schema provides:
- ✅ Flexibility for per-user customization
- ✅ Date-based question evolution
- ✅ Auto-creation from default template
- ✅ Efficient storage and querying
- ✅ Clean separation of concerns

Questions are now stored per user per date, enabling personalized journaling experiences!

