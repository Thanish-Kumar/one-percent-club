import { JournalQuestionSet, CreateJournalQuestionSetDto, UpdateJournalQuestionSetDto, Question } from "@/models/JournalQuestion"

export interface JournalQuestionRepository {
  /**
   * Get question set for a specific user and date
   */
  getQuestionSetByUserAndDate(userUid: string, entryDate: string): Promise<JournalQuestionSet | null>

  /**
   * Get all question sets for a specific user
   */
  getQuestionSetsByUser(userUid: string): Promise<JournalQuestionSet[]>

  /**
   * Get the default template question set
   */
  getDefaultQuestionSet(): Promise<Question[]>

  /**
   * Create a new question set for a user and date
   */
  createQuestionSet(data: CreateJournalQuestionSetDto): Promise<JournalQuestionSet>

  /**
   * Update an existing question set
   */
  updateQuestionSet(userUid: string, entryDate: string, data: UpdateJournalQuestionSetDto): Promise<JournalQuestionSet | null>

  /**
   * Delete a question set
   */
  deleteQuestionSet(userUid: string, entryDate: string): Promise<boolean>

  /**
   * Get or create question set for a user and date (uses default template if not exists)
   */
  getOrCreateQuestionSet(userUid: string, entryDate: string): Promise<JournalQuestionSet>
}

