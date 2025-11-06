// Individual question within a question set
export interface Question {
  id: number
  question: string
  options: string[]
}

// Question set for a specific user on a specific date
export interface JournalQuestionSet {
  id: number
  userUid: string
  entryDate: string // ISO date string (YYYY-MM-DD)
  questions: Question[]
  createdAt: Date
  updatedAt: Date
}

// DTO for creating a new question set
export interface CreateJournalQuestionSetDto {
  userUid: string
  entryDate: string // ISO date string (YYYY-MM-DD)
  questions: Question[]
}

// DTO for updating a question set
export interface UpdateJournalQuestionSetDto {
  questions?: Question[]
}

