# Journal Questions Feature Guide

## Overview

The journaling feature now supports dynamic questions fetched from a database instead of hardcoded questions. This allows you to:

- Add new questions without code changes
- Modify existing questions
- Reorder questions
- Enable/disable questions
- Manage questions through API endpoints

## Architecture

### Components

1. **Database Table**: `journal_questions`
2. **Model**: `JournalQuestion` (`src/models/JournalQuestion.ts`)
3. **Repository**: `JournalQuestionRepository` (`src/repositories/journal-question/`)
4. **API Routes**: `/api/journal-questions`
5. **UI Component**: `JournalingScreen` (`src/components/JournalingScreen.tsx`)

### Data Flow

```
Database (journal_questions table)
  ↓
Repository (AwsRdsJournalQuestionRepository)
  ↓
API Route (/api/journal-questions)
  ↓
Frontend Component (JournalingScreen)
  ↓
User Interface
```

## Setup

### 1. Run Database Migration

First, ensure your database is set up and your `.env.local` file contains the correct database credentials:

```bash
npm run db:migrate:journal-questions
```

This will:
- Create the `journal_questions` table
- Add indexes for performance
- Insert 10 default questions

### 2. Verify Installation

Check that the migration was successful:

```bash
npm run db:test
```

Or query the database directly:

```sql
SELECT * FROM journal_questions ORDER BY question_order;
```

## Database Schema

```sql
CREATE TABLE journal_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,          -- Array of answer options
  question_order INT NOT NULL,     -- Display order
  is_active BOOLEAN DEFAULT true,  -- Enable/disable questions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Example Row

```json
{
  "id": 1,
  "question_text": "How productive was your day today?",
  "options": ["Very Productive", "Moderately Productive", "Not Productive"],
  "question_order": 1,
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## API Endpoints

### GET `/api/journal-questions`

Fetch all active questions.

**Query Parameters:**
- `includeInactive` (optional): Set to `"true"` to include inactive questions

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "How productive was your day today?",
      "options": ["Very Productive", "Moderately Productive", "Not Productive"],
      "order": 1,
      "isActive": true
    }
  ]
}
```

**Example Usage:**
```javascript
// Fetch active questions only
const response = await fetch('/api/journal-questions')
const data = await response.json()

// Fetch all questions (including inactive)
const response = await fetch('/api/journal-questions?includeInactive=true')
```

### POST `/api/journal-questions`

Create a new question.

**Request Body:**
```json
{
  "questionText": "What is your main focus for tomorrow?",
  "options": ["Planning", "Execution", "Review"],
  "questionOrder": 11,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": 11,
    "question": "What is your main focus for tomorrow?",
    "options": ["Planning", "Execution", "Review"],
    "order": 11,
    "isActive": true
  }
}
```

### GET `/api/journal-questions/[id]`

Get a specific question by ID.

**Example:** `GET /api/journal-questions/1`

**Response:**
```json
{
  "success": true,
  "question": {
    "id": 1,
    "question": "How productive was your day today?",
    "options": ["Very Productive", "Moderately Productive", "Not Productive"],
    "order": 1,
    "isActive": true
  }
}
```

### PATCH `/api/journal-questions/[id]`

Update an existing question.

**Request Body** (all fields optional):
```json
{
  "questionText": "How productive was your day?",
  "options": ["Very Productive", "Productive", "Not Productive"],
  "questionOrder": 1,
  "isActive": true
}
```

**Example:**
```javascript
await fetch('/api/journal-questions/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionText: "Updated question text"
  })
})
```

### DELETE `/api/journal-questions/[id]`

Soft delete a question (sets `is_active` to `false`).

**Example:**
```javascript
await fetch('/api/journal-questions/1', {
  method: 'DELETE'
})
```

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

## Usage Examples

### Adding a New Question

```javascript
const newQuestion = {
  questionText: "What was your biggest win today?",
  options: [
    "Major milestone achieved",
    "Small progress made",
    "No significant wins"
  ],
  questionOrder: 11,
  isActive: true
}

const response = await fetch('/api/journal-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newQuestion)
})

const data = await response.json()
console.log('New question created:', data.question)
```

### Updating Question Text

```javascript
await fetch('/api/journal-questions/5', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionText: "What major challenges did you overcome?"
  })
})
```

### Reordering Questions

```javascript
// Move question 5 to position 2
await fetch('/api/journal-questions/5', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionOrder: 2
  })
})
```

### Disabling a Question

```javascript
await fetch('/api/journal-questions/3', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isActive: false
  })
})
```

### Re-enabling a Question

```javascript
await fetch('/api/journal-questions/3', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isActive: true
  })
})
```

## Frontend Integration

The `JournalingScreen` component automatically:

1. **Loads questions on mount**
   ```typescript
   useEffect(() => {
     loadQuestions()
   }, [])
   ```

2. **Displays loading state** while fetching questions

3. **Shows questions dynamically** based on database content

4. **Handles empty state** if no questions are available

### Component State

```typescript
const [questions, setQuestions] = useState<Question[]>([])
const [questionsLoading, setQuestionsLoading] = useState(false)
```

### Loading Questions

```typescript
const loadQuestions = async () => {
  setQuestionsLoading(true)
  try {
    const response = await fetch("/api/journal-questions")
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.questions) {
        setQuestions(data.questions)
      }
    }
  } catch (error) {
    console.error("Error loading journal questions:", error)
  } finally {
    setQuestionsLoading(false)
  }
}
```

## Default Questions

The migration includes 10 default questions:

1. How productive was your day today?
2. How would you rate your energy levels?
3. Did you make progress on your key goals?
4. How was your focus and concentration?
5. Did you face any major challenges?
6. How satisfied are you with today's outcomes?
7. Did you learn something new today?
8. How well did you manage your time?
9. Did you collaborate effectively with others?
10. How do you feel about tomorrow?

## Best Practices

### Question Order

- Use increments of 10 (10, 20, 30...) to make it easier to insert questions later
- Or use sequential numbering (1, 2, 3...) for simplicity

### Question Text

- Keep questions clear and concise
- Use present or past tense consistently
- Make questions actionable and specific

### Answer Options

- Provide 3-4 options for easy selection
- Order from most positive to least positive (or vice versa)
- Include a neutral option when appropriate
- Keep option text short (2-4 words)

### Soft Delete

- Never hard delete questions as they may be referenced in existing journal entries
- Use `is_active: false` to hide questions from new entries
- Old entries will still show the question text in their saved content

## Troubleshooting

### Questions Not Appearing

1. Check if migration ran successfully:
   ```bash
   npm run db:migrate:journal-questions
   ```

2. Verify questions exist in database:
   ```sql
   SELECT * FROM journal_questions WHERE is_active = true;
   ```

3. Check browser console for API errors

### Wrong Question Order

Update the `question_order` field:
```javascript
await fetch('/api/journal-questions/5', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ questionOrder: 2 })
})
```

### API Errors

Check server logs and database connection:
```bash
npm run db:test
```

## Future Enhancements

Potential features to add:

1. **User-specific questions** - Different questions for different users
2. **Question categories** - Group questions by topic
3. **Conditional questions** - Show questions based on previous answers
4. **Question templates** - Pre-made question sets
5. **Admin UI** - Web interface to manage questions
6. **Question analytics** - Track which questions get the most responses
7. **Multi-language support** - Translate questions

## Related Files

- **Migration**: `src/lib/migrations/create_journal_questions_table.sql`
- **Model**: `src/models/JournalQuestion.ts`
- **Repository Interface**: `src/repositories/journal-question/JournalQuestionRepository.ts`
- **Repository Implementation**: `src/repositories/journal-question/AwsRdsJournalQuestionRepository.ts`
- **Repository Factory**: `src/repositories/journal-question/index.ts`
- **API Routes**: `src/app/api/journal-questions/route.ts` and `[id]/route.ts`
- **Migration Script**: `src/lib/scripts/run-journal-questions-migration.ts`
- **Frontend Component**: `src/components/JournalingScreen.tsx`

## Support

For issues or questions:
1. Check the database connection
2. Review server logs
3. Verify API responses in browser dev tools
4. Check that questions are marked as `is_active: true`

