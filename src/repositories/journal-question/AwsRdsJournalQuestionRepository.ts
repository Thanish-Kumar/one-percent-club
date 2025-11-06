import { Pool } from "pg"
import { JournalQuestionSet, CreateJournalQuestionSetDto, UpdateJournalQuestionSetDto, Question } from "@/models/JournalQuestion"
import { JournalQuestionRepository } from "./JournalQuestionRepository"

export class AwsRdsJournalQuestionRepository implements JournalQuestionRepository {
  constructor(private pool: Pool) {}

  private parseQuestionsFormat(questionsData: any): Question[] {
    // Handle new format: { "Questions": [{ "Question 1": "...", "Answers": [...] }] }
    if (questionsData && questionsData.Questions && Array.isArray(questionsData.Questions)) {
      return questionsData.Questions.map((item: any, index: number) => {
        const questionKey = `Question ${index + 1}`
        const questionText = item[questionKey]
        const answers = item.Answers || []
        
        return {
          id: index + 1,
          question: questionText,
          options: answers
        }
      })
    }
    
    // Handle old format: [{ "id": 1, "question": "...", "options": [...] }]
    if (Array.isArray(questionsData)) {
      return questionsData.map((item: any) => ({
        id: item.id,
        question: item.question,
        options: item.options || []
      }))
    }
    
    // Fallback: return empty array
    return []
  }

  private mapRowToQuestionSet(row: any): JournalQuestionSet {
    return {
      id: row.id,
      userUid: row.user_uid,
      entryDate: row.entry_date,
      questions: this.parseQuestionsFormat(row.questions), // Parse the format
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
      // Return hardcoded default if template not found (new format)
      return [
        {
          id: 1,
          question: "What is the current size of your medical clinic in terms of employees and patients?",
          options: ["Less than 100", "100 to 500", "More than 500"]
        },
        {
          id: 2,
          question: "What is your current process for scheduling patient appointments?",
          options: ["Manual approach (telephone calls, physical diary)", "Semi-aligned system (spreadsheet, google calendar)", "Integrated software"]
        },
        {
          id: 3,
          question: "What specific area of your business would you most want to improve with the custom software?",
          options: ["Patients record management", "Appointment scheduling", "Billing and invoicing"]
        },
        {
          id: 4,
          question: "Do you currently use any specific software for managing your clinic?",
          options: ["We don't use any specific software", "We use software, but it is not integrated", "We use an integrated software"]
        },
        {
          id: 5,
          question: "What is your current method for storing and managing patient records?",
          options: ["Paper files", "Electronic files", "Integrated patient management system"]
        },
        {
          id: 6,
          question: "How often does your system encounter errors that impact your clinic operations?",
          options: ["Daily", "Weekly", "Rarely"]
        },
        {
          id: 7,
          question: "How do you currently manage your clinic's billing and invoicing process?",
          options: ["Manually", "Semi-automated system", "Fully automated software"]
        },
        {
          id: 8,
          question: "What is your current method for providing follow-up care to patients after an appointment?",
          options: ["Call-backs", "Email reminders", "Automated system"]
        },
        {
          id: 9,
          question: "How do you analyze your clinic's performance currently?",
          options: ["We don't have a structured approach", "We analyze data manually", "We use software analytics"]
        },
        {
          id: 10,
          question: "Where does your clinic aim to be in terms of size and service offerings in the next 5 years?",
          options: ["Maintain current size and services", "Expansion in terms of services offered", "Expansion in terms of size and services offered"]
        }
      ]
    }

    return this.parseQuestionsFormat(result.rows[0].questions)
  }

  private formatQuestionsToNewFormat(questions: Question[]): any {
    // Convert from internal format to new storage format
    const formattedQuestions = questions.map((q, index) => {
      const questionKey = `Question ${index + 1}`
      return {
        [questionKey]: q.question,
        "Answers": q.options
      }
    })
    
    return {
      "Questions": formattedQuestions
    }
  }

  async createQuestionSet(data: CreateJournalQuestionSetDto): Promise<JournalQuestionSet> {
    const query = `
      INSERT INTO journal_questions (user_uid, entry_date, questions)
      VALUES ($1, $2, $3)
      RETURNING id, user_uid, entry_date, questions, created_at, updated_at
    `

    const formattedQuestions = this.formatQuestionsToNewFormat(data.questions)

    const values = [
      data.userUid,
      data.entryDate,
      JSON.stringify(formattedQuestions),
    ]

    const result = await this.pool.query(query, values)
    return this.mapRowToQuestionSet(result.rows[0])
  }

  async updateQuestionSet(userUid: string, entryDate: string, data: UpdateJournalQuestionSetDto): Promise<JournalQuestionSet | null> {
    if (!data.questions) {
      return this.getQuestionSetByUserAndDate(userUid, entryDate)
    }

    const query = `
      UPDATE journal_questions
      SET questions = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_uid = $2 AND entry_date = $3
      RETURNING id, user_uid, entry_date, questions, created_at, updated_at
    `

    const formattedQuestions = this.formatQuestionsToNewFormat(data.questions)

    const values = [
      JSON.stringify(formattedQuestions),
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
