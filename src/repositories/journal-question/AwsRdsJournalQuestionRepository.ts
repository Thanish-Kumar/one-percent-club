import { Pool } from "pg"
import { JournalQuestionSet, CreateJournalQuestionSetDto, UpdateJournalQuestionSetDto, Question } from "@/models/JournalQuestion"
import { JournalQuestionRepository } from "./JournalQuestionRepository"

export class AwsRdsJournalQuestionRepository implements JournalQuestionRepository {
  constructor(private pool: Pool) {}

  private mapRowToQuestionSet(row: any): JournalQuestionSet {
    return {
      id: row.id,
      userUid: row.user_uid,
      entryDate: row.entry_date,
      questions: row.questions, // PostgreSQL JSONB is automatically parsed
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  async getQuestionSetByUserAndDate(userUid: string, entryDate: string): Promise<JournalQuestionSet | null> {
    const query = `
      SELECT id, user_uid, entry_date, questions, created_at, updated_at
      FROM journal_questions
      WHERE user_uid = $1 AND entry_date = $2
    `

    const result = await this.pool.query(query, [userUid, entryDate])
    
    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToQuestionSet(result.rows[0])
  }

  async getQuestionSetsByUser(userUid: string): Promise<JournalQuestionSet[]> {
    const query = `
      SELECT id, user_uid, entry_date, questions, created_at, updated_at
      FROM journal_questions
      WHERE user_uid = $1
      ORDER BY entry_date DESC
    `

    const result = await this.pool.query(query, [userUid])
    return result.rows.map(this.mapRowToQuestionSet)
  }

  async getDefaultQuestionSet(): Promise<Question[]> {
    const query = `
      SELECT questions
      FROM journal_questions
      WHERE user_uid = 'default_template'
      LIMIT 1
    `

    const result = await this.pool.query(query)
    
    if (result.rows.length === 0) {
      // Return hardcoded default if template not found
      return [
        {
          id: 1,
          question: "How productive was your day today?",
          options: ["Very Productive", "Moderately Productive", "Not Productive"]
        },
        {
          id: 2,
          question: "How would you rate your energy levels?",
          options: ["High Energy", "Moderate Energy", "Low Energy"]
        },
        {
          id: 3,
          question: "Did you make progress on your key goals?",
          options: ["Significant Progress", "Some Progress", "No Progress"]
        },
        {
          id: 4,
          question: "How was your focus and concentration?",
          options: ["Excellent Focus", "Fair Focus", "Poor Focus"]
        },
        {
          id: 5,
          question: "Did you face any major challenges?",
          options: ["No Challenges", "Minor Challenges", "Major Challenges"]
        },
        {
          id: 6,
          question: "How satisfied are you with today's outcomes?",
          options: ["Very Satisfied", "Somewhat Satisfied", "Not Satisfied"]
        },
        {
          id: 7,
          question: "Did you learn something new today?",
          options: ["Learned a Lot", "Learned Something", "Learned Nothing"]
        },
        {
          id: 8,
          question: "How well did you manage your time?",
          options: ["Excellent", "Good", "Poor"]
        },
        {
          id: 9,
          question: "Did you collaborate effectively with others?",
          options: ["Very Effective", "Somewhat Effective", "Not Effective"]
        },
        {
          id: 10,
          question: "How do you feel about tomorrow?",
          options: ["Excited & Ready", "Neutral", "Anxious or Uncertain"]
        }
      ]
    }

    return result.rows[0].questions
  }

  async createQuestionSet(data: CreateJournalQuestionSetDto): Promise<JournalQuestionSet> {
    const query = `
      INSERT INTO journal_questions (user_uid, entry_date, questions)
      VALUES ($1, $2, $3)
      RETURNING id, user_uid, entry_date, questions, created_at, updated_at
    `

    const values = [
      data.userUid,
      data.entryDate,
      JSON.stringify(data.questions),
    ]

    const result = await this.pool.query(query, values)
    return this.mapRowToQuestionSet(result.rows[0])
  }

  async updateQuestionSet(userUid: string, entryDate: string, data: UpdateJournalQuestionSetDto): Promise<JournalQuestionSet | null> {
    const query = `
      UPDATE journal_questions
      SET questions = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_uid = $2 AND entry_date = $3
      RETURNING id, user_uid, entry_date, questions, created_at, updated_at
    `

    const values = [
      JSON.stringify(data.questions),
      userUid,
      entryDate
    ]

    const result = await this.pool.query(query, values)
    
    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToQuestionSet(result.rows[0])
  }

  async deleteQuestionSet(userUid: string, entryDate: string): Promise<boolean> {
    const query = `
      DELETE FROM journal_questions
      WHERE user_uid = $1 AND entry_date = $2
      RETURNING id
    `

    const result = await this.pool.query(query, [userUid, entryDate])
    return result.rows.length > 0
  }

  async getOrCreateQuestionSet(userUid: string, entryDate: string): Promise<JournalQuestionSet> {
    // First, try to get existing question set
    const existing = await this.getQuestionSetByUserAndDate(userUid, entryDate)
    
    if (existing) {
      return existing
    }

    // If not found, create a new one using the default template
    const defaultQuestions = await this.getDefaultQuestionSet()
    
    return await this.createQuestionSet({
      userUid,
      entryDate,
      questions: defaultQuestions
    })
  }
}
