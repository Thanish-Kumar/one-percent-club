# Journal Questions - Read-Only Update

## ✅ Changes Completed

The journal questions system has been updated to be **read-only** for users. Questions are no longer auto-created or modified through the API.

---

## 🎯 What Changed

### **Before (❌ Old Behavior):**
```
User visits date → API checks database
  ├─ Questions exist? → Return them
  └─ Not found? → CREATE new row from template
                  WRITE to database
                  Return questions
```

**Problem:** Unnecessary database writes, cluttering `journal_questions` table with duplicate question sets.

---

### **After (✅ New Behavior):**
```
User visits date → API checks database
  ├─ Custom questions exist? → Return them
  └─ Not found? → Return default template
                  NO database write
```

**Solution:** Clean separation - questions are read-only, only default template in database.

---

## 📝 Code Changes

### **1. GET Method Updated** (`/api/journal-questions/route.ts`)

**Old Code:**
```typescript
if (existingSet) {
  return existingSet
} else {
  // ❌ AUTO-CREATED NEW ROW
  questionSet = await repository.getOrCreateQuestionSet(userUid, entryDate)
  return questionSet
}
```

**New Code:**
```typescript
if (existingSet) {
  // Return custom questions
  questions = existingSet.questions
} else {
  // ✅ JUST RETURN DEFAULT, NO DB WRITE
  questions = await repository.getDefaultQuestionSet()
}
```

### **2. POST Method Disabled** (`/api/journal-questions/route.ts`)

**Old Code:**
```typescript
export async function POST(request: NextRequest) {
  // ❌ ALLOWED CREATING/UPDATING QUESTIONS
  const questionSet = await repository.createQuestionSet(...)
  return questionSet
}
```

**New Code:**
```typescript
export async function POST(request: NextRequest) {
  // ✅ BLOCKED
  return NextResponse.json(
    { error: "Question modification is not allowed. Questions are read-only." },
    { status: 403 }
  )
}
```

---

## 🗑️ Database Cleanup

### **Before Cleanup:**
```sql
journal_questions table:
  1. default_template @ 2025-11-05  ← Required
  2. user123 @ 2025-11-04           ← Auto-generated (unnecessary)
```

### **After Cleanup:**
```sql
journal_questions table:
  1. default_template @ 2025-11-05  ← Only this remains
```

**Command used:**
```bash
npm run db:cleanup:journal-questions
```

**Result:**
- ✅ Deleted 1 auto-generated question set
- ✅ Kept only default_template
- ✅ Database is clean

---

## 📊 Table Separation

### **`journal_questions` Table** 📋
- **Purpose**: Store question TEMPLATES only
- **Contains**: Default template with 10 clinic questions
- **Rows**: 1 row (`default_template`)
- **Operations**: READ ONLY for users
- **Modifications**: Only by admins directly in database

### **`journal_entries` Table** 📝
- **Purpose**: Store user ANSWERS only
- **Contains**: User responses to questions
- **Rows**: One per user per date (can be many)
- **Operations**: CREATE, UPDATE by users
- **API**: `POST /api/journal`

---

## 🔄 Current Flow

```
┌─────────────────────────────────────────┐
│ User opens journaling screen            │
│ Selects date: 2025-11-06                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ GET /api/journal-questions              │
│   ?userUid=user123                      │
│   &entryDate=2025-11-06                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Check: Custom questions for user+date?  │
│   SELECT * FROM journal_questions       │
│   WHERE user_uid='user123'              │
│     AND entry_date='2025-11-06'         │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌────────┐    ┌────────┐
   │ Found  │    │ Not    │
   │        │    │ Found  │
   └───┬────┘    └───┬────┘
       │             │
       ▼             ▼
  ┌────────┐    ┌─────────────┐
  │ Return │    │ GET default │
  │ custom │    │ template    │
  │ set    │    │ (READ ONLY) │
  └────────┘    └─────────────┘
       │             │
       └──────┬──────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Frontend displays 10 questions          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ User answers questions                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ POST /api/journal                       │
│ Saves to journal_entries table          │
│ (SEPARATE TABLE - user answers)         │
└─────────────────────────────────────────┘
```

---

## ✅ Benefits

### **1. Clean Database** 🗄️
- Only 1 row in `journal_questions` (default template)
- No duplicate question sets per user
- Minimal storage usage

### **2. Simplified Logic** 🧩
- Questions are truly read-only
- No confusion about where to save what
- Clear separation: questions vs answers

### **3. Performance** ⚡
- No unnecessary writes to database
- Faster API responses
- Less database operations

### **4. Maintainability** 🔧
- Easy to update default questions (1 row)
- No orphaned question sets
- Clean data model

---

## 🧪 Testing

### **Test 1: Fetch Questions**
```bash
# User visits any date
curl "http://localhost:3000/api/journal-questions?userUid=user123&entryDate=2025-11-10"
```

**Expected:**
```json
{
  "success": true,
  "questions": [...10 clinic questions...],
  "isDefault": true,
  "userUid": "user123",
  "entryDate": "2025-11-10"
}
```

**Console Log:**
```
📋 Returning default template for user user123 on 2025-11-10 (not saved to database)
```

### **Test 2: Try to Create Questions (Blocked)**
```bash
curl -X POST "http://localhost:3000/api/journal-questions" \
  -H "Content-Type: application/json" \
  -d '{"userUid":"user123","entryDate":"2025-11-10","questions":[]}'
```

**Expected:**
```json
{
  "success": false,
  "error": "Question modification is not allowed. Questions are read-only."
}
```

**Status:** 403 Forbidden ✅

### **Test 3: Save Answers (Works)**
```bash
curl -X POST "http://localhost:3000/api/journal" \
  -H "Content-Type: application/json" \
  -d '{"userUid":"user123","entryDate":"2025-11-10","content":"My answers..."}'
```

**Expected:**
```json
{
  "id": 123,
  "userUid": "user123",
  "entryDate": "2025-11-10",
  "content": "My answers..."
}
```

**Status:** 200 OK ✅  
**Saved to:** `journal_entries` table ✅

---

## 📊 Database State

### **Check Current State:**
```bash
npm run db:verify:journal-questions
```

**Expected Output:**
```
✅ Table journal_questions exists

📊 Statistics:
   Total question sets: 1
   
   1. 📋 [DEFAULT] default_template @ 2025-11-05 (10 questions)
```

### **Manual SQL Check:**
```sql
SELECT user_uid, entry_date, 
       jsonb_array_length(questions) as question_count
FROM journal_questions;
```

**Expected Result:**
```
user_uid         | entry_date | question_count
-----------------|------------|---------------
default_template | 2025-11-05 | 10
```

**Only 1 row!** ✅

---

## 🔧 Admin Operations

### **Update Default Questions:**
```bash
npm run db:update-default-template
```

### **View Default Questions:**
```sql
SELECT questions 
FROM journal_questions 
WHERE user_uid = 'default_template';
```

### **Modify Default Questions (SQL):**
```sql
UPDATE journal_questions
SET questions = '{
  "Questions": [
    {
      "Question 1": "Your custom question?",
      "Answers": ["Option 1", "Option 2", "Option 3"]
    }
  ]
}'::jsonb
WHERE user_uid = 'default_template';
```

---

## 📋 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Questions per user** | Duplicated | Shared default |
| **Database writes** | Auto-created | None |
| **journal_questions rows** | Multiple | 1 (default) |
| **POST endpoint** | Allowed | Blocked (403) |
| **User answers** | Correct (journal_entries) | Unchanged ✅ |
| **Performance** | Slower | Faster |
| **Maintenance** | Complex | Simple |

---

## ✅ Result

- ✅ **Questions are read-only**
- ✅ **No auto-creation of question sets**
- ✅ **Database cleaned (1 row only)**
- ✅ **POST endpoint disabled**
- ✅ **User answers still save correctly to journal_entries**
- ✅ **Clean separation maintained**

**The system now works exactly as intended!** 🎉

Users get default questions without database pollution, and their answers are saved to the correct table (`journal_entries`).

