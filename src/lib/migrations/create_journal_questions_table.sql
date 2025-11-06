-- Create journal_questions table
-- Stores question sets per user per date
CREATE TABLE IF NOT EXISTS journal_questions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  entry_date DATE NOT NULL,
  questions JSONB NOT NULL, -- Array of questions with id, question, and options
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date_questions UNIQUE(user_uid, entry_date)
);

-- Create index on user_uid for faster user lookups
CREATE INDEX idx_journal_questions_user ON journal_questions(user_uid);

-- Create index on entry_date for faster date lookups
CREATE INDEX idx_journal_questions_date ON journal_questions(entry_date);

-- Create composite index for user+date queries
CREATE INDEX idx_journal_questions_user_date ON journal_questions(user_uid, entry_date);

-- Insert default question set for demonstration (no user_uid, represents default template)
-- This can be used as a template when creating question sets for new users
INSERT INTO journal_questions (user_uid, entry_date, questions) VALUES
  (
    'default_template',
    CURRENT_DATE,
    '[
      {
        "id": 1,
        "question": "How productive was your day today?",
        "options": ["Very Productive", "Moderately Productive", "Not Productive"]
      },
      {
        "id": 2,
        "question": "How would you rate your energy levels?",
        "options": ["High Energy", "Moderate Energy", "Low Energy"]
      },
      {
        "id": 3,
        "question": "Did you make progress on your key goals?",
        "options": ["Significant Progress", "Some Progress", "No Progress"]
      },
      {
        "id": 4,
        "question": "How was your focus and concentration?",
        "options": ["Excellent Focus", "Fair Focus", "Poor Focus"]
      },
      {
        "id": 5,
        "question": "Did you face any major challenges?",
        "options": ["No Challenges", "Minor Challenges", "Major Challenges"]
      },
      {
        "id": 6,
        "question": "How satisfied are you with today''s outcomes?",
        "options": ["Very Satisfied", "Somewhat Satisfied", "Not Satisfied"]
      },
      {
        "id": 7,
        "question": "Did you learn something new today?",
        "options": ["Learned a Lot", "Learned Something", "Learned Nothing"]
      },
      {
        "id": 8,
        "question": "How well did you manage your time?",
        "options": ["Excellent", "Good", "Poor"]
      },
      {
        "id": 9,
        "question": "Did you collaborate effectively with others?",
        "options": ["Very Effective", "Somewhat Effective", "Not Effective"]
      },
      {
        "id": 10,
        "question": "How do you feel about tomorrow?",
        "options": ["Excited & Ready", "Neutral", "Anxious or Uncertain"]
      }
    ]'::jsonb
  );

