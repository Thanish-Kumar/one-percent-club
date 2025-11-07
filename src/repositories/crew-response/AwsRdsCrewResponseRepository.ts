import { Pool } from 'pg';
import { CrewResponseRepository } from './CrewResponseRepository';
import { 
  CrewResponseDatabaseDTO, 
  CreateCrewResponseRequestDTO,
  GetCrewResponsesQueryDTO,
  CrewResponseDatabaseErrorDTO
} from '@/dto/crew-response';
import { getDatabasePool } from '@/lib/database';
import { getJournalQuestionRepository } from '@/repositories/journal-question';
import { Question } from '@/models/JournalQuestion';

// Helper function to handle database errors
const handleDatabaseError = (error: any): CrewResponseDatabaseErrorDTO => {
  const errorCode = error.code || 'UNKNOWN';
  const errorMessage = error.message || 'An unknown database error occurred';
  
  // Map common PostgreSQL error codes to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    '23505': 'Crew response already exists.', // unique_violation
    '23503': 'Foreign key constraint violation. User does not exist.', // foreign_key_violation
    '23502': 'Required field is missing.', // not_null_violation
    '23514': 'Check constraint violation.', // check_violation
    '42P01': 'Table does not exist.', // undefined_table
    '08006': 'Connection to database failed.', // connection_failure
    '28000': 'Invalid authentication credentials.', // invalid_authorization_specification
  };

  return {
    code: errorCode,
    message: errorMessages[errorCode] || errorMessage,
    details: errorCode,
  };
};

// Helper function to map database row to CrewResponseDatabaseDTO
const mapRowToCrewResponse = (row: any): CrewResponseDatabaseDTO => {
  return {
    id: row.id,
    userUid: row.user_uid,
    requestContext: row.request_context,
    requestGoal: row.request_goal,
    responseData: row.response_data,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
};

// Helper function to extract questions from crew response data
const extractQuestionsFromResponse = (responseData: Record<string, any>): Question[] | null => {
  try {
    // Check if response has Questions array
    if (responseData.Questions && Array.isArray(responseData.Questions)) {
      return responseData.Questions.map((item: any, index: number) => {
        const questionKey = `Question ${index + 1}`;
        const questionText = item[questionKey];
        const answers = item.Answers || [];
        
        return {
          id: index + 1,
          question: questionText,
          options: answers
        };
      });
    }
    
    // If no valid Questions array found, return null
    return null;
  } catch (error) {
    console.error('Error extracting questions from crew response:', error);
    return null;
  }
};

export class AwsRdsCrewResponseRepository implements CrewResponseRepository {
  private pool: Pool;

  constructor() {
    this.pool = getDatabasePool();
  }

  async createCrewResponse(data: CreateCrewResponseRequestDTO): Promise<CrewResponseDatabaseDTO> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO crew_responses (user_uid, request_context, request_goal, response_data)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        data.userUid,
        data.requestContext || null,
        data.requestGoal || null,
        JSON.stringify(data.responseData),
      ];

      const result = await client.query(query, values);
      return mapRowToCrewResponse(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Upsert crew response - Insert or Update for the same user on the same day
   * This ensures only one entry per user per day
   * Also syncs questions to journal_questions table
   */
  async upsertCrewResponse(data: CreateCrewResponseRequestDTO): Promise<CrewResponseDatabaseDTO> {
    const client = await this.pool.connect();
    
    try {
      // Use INSERT ... ON CONFLICT to handle upsert
      // The unique constraint is on (user_uid, DATE(created_at))
      // Return DATE(created_at) as a separate column to avoid timezone conversion issues
      const query = `
        INSERT INTO crew_responses (user_uid, request_context, request_goal, response_data, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_uid, DATE(created_at))
        DO UPDATE SET
          request_context = EXCLUDED.request_context,
          request_goal = EXCLUDED.request_goal,
          response_data = EXCLUDED.response_data,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *, DATE(created_at) as entry_date
      `;
      
      const values = [
        data.userUid,
        data.requestContext || null,
        data.requestGoal || null,
        JSON.stringify(data.responseData),
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];
      const crewResponse = mapRowToCrewResponse(row);
      
      // Get the entry_date directly from the database query to avoid timezone issues
      const entryDate = row.entry_date;

      console.log(`Entry Date: ${entryDate}`);
      
      // Sync questions to journal_questions table using the date from database
      await this.syncQuestionsToJournalTable(data.userUid, entryDate, data.responseData);
      
      return crewResponse;
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getCrewResponsesByUserUid(userUid: string, limit: number = 100, offset: number = 0): Promise<CrewResponseDatabaseDTO[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM crew_responses 
        WHERE user_uid = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const result = await client.query(query, [userUid, limit, offset]);
      
      return result.rows.map(mapRowToCrewResponse);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getCrewResponseById(id: number): Promise<CrewResponseDatabaseDTO | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM crew_responses WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return mapRowToCrewResponse(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Check if a crew response exists for a user for today
   * Returns true if entry exists, false otherwise
   */
  async hasResponseForToday(userUid: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM crew_responses 
          WHERE user_uid = $1 
          AND DATE(created_at) = CURRENT_DATE
        ) as exists
      `;
      const result = await client.query(query, [userUid]);
      
      return result.rows[0].exists;
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get crew response for a user for today (if exists)
   */
  async getResponseForToday(userUid: string): Promise<CrewResponseDatabaseDTO | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM crew_responses 
        WHERE user_uid = $1 
        AND DATE(created_at) = CURRENT_DATE
      `;
      const result = await client.query(query, [userUid]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return mapRowToCrewResponse(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getCrewResponses(query: GetCrewResponsesQueryDTO): Promise<CrewResponseDatabaseDTO[]> {
    const client = await this.pool.connect();
    
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (query.userUid) {
        conditions.push(`user_uid = $${paramCount++}`);
        values.push(query.userUid);
      }

      if (query.startDate) {
        conditions.push(`created_at >= $${paramCount++}`);
        values.push(query.startDate);
      }

      if (query.endDate) {
        conditions.push(`created_at <= $${paramCount++}`);
        values.push(query.endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = query.limit || 100;
      const offset = query.offset || 0;

      values.push(limit, offset);

      const sqlQuery = `
        SELECT * FROM crew_responses 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramCount++} OFFSET $${paramCount}
      `;

      const result = await client.query(sqlQuery, values);
      return result.rows.map(mapRowToCrewResponse);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async deleteCrewResponse(id: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM crew_responses WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rowCount === 0) {
        throw new Error('Crew response not found');
      }
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async deleteCrewResponsesByUserUid(userUid: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM crew_responses WHERE user_uid = $1';
      await client.query(query, [userUid]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Sync questions from crew response to journal_questions table
   * This updates or creates journal questions for the user and date
   * 
   * @param userUid - The user's UID
   * @param entryDate - Date string (YYYY-MM-DD) directly from database to avoid timezone issues
   * @param responseData - The crew API response data containing questions
   */
  private async syncQuestionsToJournalTable(
    userUid: string, 
    entryDate: string, 
    responseData: Record<string, any>
  ): Promise<void> {
    try {
      // Extract questions from response data
      const questions = extractQuestionsFromResponse(responseData);
      
      if (!questions || questions.length === 0) {
        console.log(`⚠️  No valid questions found in crew response for user ${userUid}. Skipping journal sync.`);
        return;
      }
      
      // Get the journal question repository
      const journalQuestionRepo = getJournalQuestionRepository();
      
      // Check if questions already exist for this user and date
      const existingQuestionSet = await journalQuestionRepo.getQuestionSetByUserAndDate(userUid, entryDate);
      
      if (existingQuestionSet) {
        // Update existing question set
        await journalQuestionRepo.updateQuestionSet(userUid, entryDate, { questions });
        console.log(`✅ Updated journal questions for user ${userUid} on ${entryDate}`);
      } else {
        // Create new question set
        await journalQuestionRepo.createQuestionSet({
          userUid,
          entryDate,
          questions
        });
        console.log(`✅ Created journal questions for user ${userUid} on ${entryDate}`);
      }
    } catch (error) {
      // Log the error but don't throw - we don't want to fail the crew response upsert
      // if journal sync fails
      console.error(`❌ Failed to sync questions to journal_questions table for user ${userUid}:`, error);
    }
  }

  handleDatabaseError(error: any): CrewResponseDatabaseErrorDTO {
    return handleDatabaseError(error);
  }
}

// Export singleton instance
export const awsRdsCrewResponseRepository = new AwsRdsCrewResponseRepository();

