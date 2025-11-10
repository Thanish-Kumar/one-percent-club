// AWS RDS PostgreSQL implementation of SolutionRepository
// Following clean architecture - framework layer

import { Pool } from 'pg';
import { SolutionRepository } from './SolutionRepository';
import { Solution } from '@/models/Solution';
import { CreateSolutionDTO, GetSolutionsDTO } from '@/dto/solution';
import { getDatabasePool } from '@/lib/database';

export class AwsRdsSolutionRepository implements SolutionRepository {
  private pool: Pool;

  constructor() {
    this.pool = getDatabasePool();
  }

  async createSolution(data: CreateSolutionDTO): Promise<Solution> {
    try {
      const query = `
        INSERT INTO solutions (user_uid, entry_date, journal_entry_id, solution)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        data.userUid,
        data.entryDate,
        data.journalEntryId,
        JSON.stringify(data.solution),
      ];

      const result = await this.pool.query(query, values);
      return this.mapRowToSolution(result.rows[0]);
    } catch (error) {
      console.error('Error creating solution:', error);
      throw new Error('Failed to create solution');
    }
  }

  async getSolutions(filters: GetSolutionsDTO): Promise<Solution[]> {
    try {
      let query = `SELECT * FROM solutions WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.userUid) {
        query += ` AND user_uid = $${paramIndex}`;
        values.push(filters.userUid);
        paramIndex++;
      }

      if (filters.entryDate) {
        query += ` AND entry_date = $${paramIndex}`;
        values.push(filters.entryDate);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND entry_date >= $${paramIndex}`;
        values.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND entry_date <= $${paramIndex}`;
        values.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToSolution(row));
    } catch (error) {
      console.error('Error getting solutions:', error);
      throw new Error('Failed to retrieve solutions');
    }
  }

  async getSolutionById(id: number): Promise<Solution | null> {
    try {
      const query = `SELECT * FROM solutions WHERE id = $1`;
      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToSolution(result.rows[0]);
    } catch (error) {
      console.error('Error getting solution by ID:', error);
      throw new Error('Failed to retrieve solution');
    }
  }

  async getSolutionsByJournalEntry(journalEntryId: number): Promise<Solution[]> {
    try {
      const query = `
        SELECT * FROM solutions 
        WHERE journal_entry_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [journalEntryId]);
      return result.rows.map(row => this.mapRowToSolution(row));
    } catch (error) {
      console.error('Error getting solutions by journal entry:', error);
      throw new Error('Failed to retrieve solutions');
    }
  }

  async deleteSolution(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM solutions WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting solution:', error);
      throw new Error('Failed to delete solution');
    }
  }

  private mapRowToSolution(row: any): Solution {
    return {
      id: row.id,
      userUid: row.user_uid,
      entryDate: new Date(row.entry_date),
      journalEntryId: row.journal_entry_id,
      solution: row.solution,
      createdAt: new Date(row.created_at),
    };
  }
}

// Export singleton instance
export const awsRdsSolutionRepository = new AwsRdsSolutionRepository();



