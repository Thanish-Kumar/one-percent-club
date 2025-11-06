# Journal Questions Quick Start

## Setup (One-Time)

```bash
# 1. Run the migration to create the table and seed default questions
npm run db:migrate:journal-questions
```

## Managing Questions via API

### Fetch All Active Questions
```bash
curl http://localhost:3000/api/journal-questions
```

### Add a New Question
```bash
curl -X POST http://localhost:3000/api/journal-questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What was your biggest win today?",
    "options": ["Major milestone", "Small progress", "No wins"],
    "questionOrder": 11,
    "isActive": true
  }'
```

### Update a Question
```bash
curl -X PATCH http://localhost:3000/api/journal-questions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Updated question text"
  }'
```

### Disable a Question (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/api/journal-questions/1
```

### Re-enable a Question
```bash
curl -X PATCH http://localhost:3000/api/journal-questions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

## Database Queries

### View All Questions
```sql
SELECT * FROM journal_questions ORDER BY question_order;
```

### View Only Active Questions
```sql
SELECT * FROM journal_questions WHERE is_active = true ORDER BY question_order;
```

### Add Question Directly in Database
```sql
INSERT INTO journal_questions (question_text, options, question_order)
VALUES (
  'What is your energy level right now?',
  '["High", "Medium", "Low"]'::jsonb,
  11
);
```

### Update Question Order
```sql
UPDATE journal_questions 
SET question_order = 5 
WHERE id = 3;
```

## Frontend Behavior

- Questions are loaded automatically when the journaling screen opens
- Shows loading spinner while fetching questions
- Displays "No questions available" if database is empty
- Questions appear in order specified by `question_order` field
- Only active questions (`is_active = true`) are shown to users

## Default Questions

10 questions are automatically created during migration:
1. Productivity level
2. Energy levels
3. Goal progress
4. Focus/concentration
5. Challenges faced
6. Satisfaction with outcomes
7. Learning
8. Time management
9. Collaboration
10. Tomorrow's outlook

## Troubleshooting

**Questions not showing?**
```bash
# Check if table exists and has data
npm run db:test
```

**Need to reset questions?**
```sql
-- Delete all questions
DELETE FROM journal_questions;

-- Re-run migration
npm run db:migrate:journal-questions
```

See `JOURNAL_QUESTIONS_GUIDE.md` for complete documentation.

