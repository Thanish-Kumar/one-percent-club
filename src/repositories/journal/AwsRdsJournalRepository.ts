// AWS RDS PostgreSQL implementation of JournalRepository
// Following clean architecture - framework layer

import { Pool } from 'pg';
import { JournalRepository } from './JournalRepository';
import { JournalEntry } from '@/models/JournalEntry';
import {
  CreateJournalEntryDTO,
  GetJournalEntryDTO,
  JournalEntriesListDTO,
} from '@/dto/journal';
import { getDatabasePool } from '@/lib/database';

export class AwsRdsJournalRepository implements JournalRepository {
  private pool: Pool;

  constructor() {
    this.pool = getDatabasePool();
  }

  async upsertEntry(data: CreateJournalEntryDTO): Promise<JournalEntry> {
    try {
      const query = `
        INSERT INTO journal_entries (user_uid, entry_date, content, word_count)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_uid, entry_date)
        DO UPDATE SET 
          content = EXCLUDED.content,
          word_count = EXCLUDED.word_count,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [
        data.userUid,
        data.entryDate,
        data.content,
        data.wordCount,
      ];

      const result = await this.pool.query(query, values);
      return this.mapRowToJournalEntry(result.rows[0]);
    } catch (error) {
      console.error('Error upserting journal entry:', error);
      throw new Error('Failed to save journal entry');
    }
  }

  async getEntryByDate(data: GetJournalEntryDTO): Promise<JournalEntry | null> {
    try {
      const query = `
        SELECT * FROM journal_entries
        WHERE user_uid = $1 AND entry_date = $2
      `;

      const values = [data.userUid, data.entryDate];
      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToJournalEntry(result.rows[0]);
    } catch (error) {
      console.error('Error getting journal entry:', error);
      throw new Error('Failed to retrieve journal entry');
    }
  }

  async getEntriesByDateRange(data: JournalEntriesListDTO): Promise<JournalEntry[]> {
    try {
      let query = `
        SELECT * FROM journal_entries
        WHERE user_uid = $1
      `;

      const values: any[] = [data.userUid];
      let paramIndex = 2;

      if (data.startDate) {
        query += ` AND entry_date >= $${paramIndex}`;
        values.push(data.startDate);
        paramIndex++;
      }

      if (data.endDate) {
        query += ` AND entry_date <= $${paramIndex}`;
        values.push(data.endDate);
        paramIndex++;
      }

      query += ` ORDER BY entry_date DESC`;

      if (data.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(data.limit);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToJournalEntry(row));
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw new Error('Failed to retrieve journal entries');
    }
  }

  async deleteEntry(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM journal_entries WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error('Failed to delete journal entry');
    }
  }

  async getEntryDates(userUid: string, year: number, month: number): Promise<Date[]> {
    try {
      // Month is 1-indexed in SQL
      const query = `
        SELECT entry_date FROM journal_entries
        WHERE user_uid = $1 
        AND EXTRACT(YEAR FROM entry_date) = $2
        AND EXTRACT(MONTH FROM entry_date) = $3
        ORDER BY entry_date
      `;

      const values = [userUid, year, month];
      const result = await this.pool.query(query, values);
      return result.rows.map(row => new Date(row.entry_date));
    } catch (error) {
      console.error('Error getting entry dates:', error);
      throw new Error('Failed to retrieve entry dates');
    }
  }

  private mapRowToJournalEntry(row: any): JournalEntry {
    return {
      id: row.id,
      userUid: row.user_uid,
      entryDate: new Date(row.entry_date),
      content: row.content,
      wordCount: row.word_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

