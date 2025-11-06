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
    '{
      "Questions": [
        {
          "Question 1": "What is the current size of your medical clinic in terms of employees and patients?",
          "Answers": [
            "Less than 100",
            "100 to 500",
            "More than 500"
          ]
        },
        {
          "Question 2": "What is your current process for scheduling patient appointments?",
          "Answers": [
            "Manual approach (telephone calls, physical diary)",
            "Semi-aligned system (spreadsheet, google calendar)",
            "Integrated software"
          ]
        },
        {
          "Question 3": "What specific area of your business would you most want to improve with the custom software?",
          "Answers": [
            "Patients record management",
            "Appointment scheduling",
            "Billing and invoicing"
          ]
        },
        {
          "Question 4": "Do you currently use any specific software for managing your clinic?",
          "Answers": [
            "We don''t use any specific software",
            "We use software, but it is not integrated",
            "We use an integrated software"
          ]
        },
        {
          "Question 5": "What is your current method for storing and managing patient records?",
          "Answers": [
            "Paper files",
            "Electronic files",
            "Integrated patient management system"
          ]
        },
        {
          "Question 6": "How often does your system encounter errors that impact your clinic operations?",
          "Answers": [
            "Daily",
            "Weekly",
            "Rarely"
          ]
        },
        {
          "Question 7": "How do you currently manage your clinic''s billing and invoicing process?",
          "Answers": [
            "Manually",
            "Semi-automated system",
            "Fully automated software"
          ]
        },
        {
          "Question 8": "What is your current method for providing follow-up care to patients after an appointment?",
          "Answers": [
            "Call-backs",
            "Email reminders",
            "Automated system"
          ]
        },
        {
          "Question 9": "How do you analyze your clinic''s performance currently?",
          "Answers": [
            "We don''t have a structured approach",
            "We analyze data manually",
            "We use software analytics"
          ]
        },
        {
          "Question 10": "Where does your clinic aim to be in terms of size and service offerings in the next 5 years?",
          "Answers": [
            "Maintain current size and services",
            "Expansion in terms of services offered",
            "Expansion in terms of size and services offered"
          ]
        }
      ]
    }'::jsonb
  );

