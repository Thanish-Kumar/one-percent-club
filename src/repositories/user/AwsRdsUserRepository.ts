import { Pool, PoolClient } from 'pg';
import { UserRepository } from './UserRepository';
import { CreateUserRequestDTO, UpdateUserRequestDTO, UserDatabaseDTO, UserDatabaseErrorDTO } from '@/dto/user';
import { User } from '@/models/User';
import { getDatabasePool } from '@/lib/database';

// Helper function to handle database errors
const handleDatabaseError = (error: any): UserDatabaseErrorDTO => {
  const errorCode = error.code || 'UNKNOWN';
  const errorMessage = error.message || 'An unknown database error occurred';
  
  // Map common PostgreSQL error codes to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    '23505': 'User already exists.', // unique_violation
    '23503': 'Foreign key constraint violation.', // foreign_key_violation
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

// Helper function to map database row to UserDatabaseDTO
const mapRowToUser = (row: any): UserDatabaseDTO => {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    photoURL: row.photo_url,
    emailVerified: row.email_verified,
    useCase: row.use_case,
    goal: row.goal,
    context: row.context,
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

export class AwsRdsUserRepository implements UserRepository {
  private pool: Pool;

  constructor() {
    this.pool = getDatabasePool();
  }

  async createUser(userData: CreateUserRequestDTO): Promise<UserDatabaseDTO> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO users (uid, email, display_name, first_name, last_name, photo_url, email_verified, use_case, goal, context)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        userData.uid,
        userData.email,
        userData.displayName,
        userData.firstName,
        userData.lastName,
        userData.photoURL,
        userData.emailVerified,
        userData.useCase,
        userData.goal,
        userData.context,
      ];

      const result = await client.query(query, values);
      return mapRowToUser(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getUserByUid(uid: string): Promise<UserDatabaseDTO | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE uid = $1';
      const result = await client.query(query, [uid]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return mapRowToUser(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getUserById(id: number): Promise<UserDatabaseDTO | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return mapRowToUser(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async updateUser(uid: string, updates: UpdateUserRequestDTO): Promise<UserDatabaseDTO> {
    const client = await this.pool.connect();
    
    try {
      // Build dynamic update query
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }
      if (updates.displayName !== undefined) {
        fields.push(`display_name = $${paramCount++}`);
        values.push(updates.displayName);
      }
      if (updates.firstName !== undefined) {
        fields.push(`first_name = $${paramCount++}`);
        values.push(updates.firstName);
      }
      if (updates.lastName !== undefined) {
        fields.push(`last_name = $${paramCount++}`);
        values.push(updates.lastName);
      }
      if (updates.photoURL !== undefined) {
        fields.push(`photo_url = $${paramCount++}`);
        values.push(updates.photoURL);
      }
      if (updates.emailVerified !== undefined) {
        fields.push(`email_verified = $${paramCount++}`);
        values.push(updates.emailVerified);
      }
      if (updates.useCase !== undefined) {
        fields.push(`use_case = $${paramCount++}`);
        values.push(updates.useCase);
      }
      if (updates.goal !== undefined) {
        fields.push(`goal = $${paramCount++}`);
        values.push(updates.goal);
      }
      if (updates.context !== undefined) {
        fields.push(`context = $${paramCount++}`);
        values.push(updates.context);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add uid to values for WHERE clause
      values.push(uid);

      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE uid = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return mapRowToUser(result.rows[0]);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async deleteUser(uid: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM users WHERE uid = $1';
      const result = await client.query(query, [uid]);
      
      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getUsers(limit: number = 100, offset: number = 0): Promise<UserDatabaseDTO[]> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(mapRowToUser);
    } catch (error: any) {
      throw handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  handleDatabaseError(error: any): UserDatabaseErrorDTO {
    return handleDatabaseError(error);
  }
}

// Export singleton instance
export const awsRdsUserRepository = new AwsRdsUserRepository();

