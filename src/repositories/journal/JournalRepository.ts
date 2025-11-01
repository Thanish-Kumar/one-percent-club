// Repository interface for journal entry data access
// Following clean architecture principles - technology agnostic

import { JournalEntry } from '@/models/JournalEntry';
import {
  CreateJournalEntryDTO,
  UpdateJournalEntryDTO,
  GetJournalEntryDTO,
  JournalEntriesListDTO,
} from '@/dto/journal';

export interface JournalRepository {
  /**
   * Create or update a journal entry for a specific date
   * If entry exists for that date, it will be updated
   */
  upsertEntry(data: CreateJournalEntryDTO): Promise<JournalEntry>;

  /**
   * Get a journal entry for a specific user and date
   */
  getEntryByDate(data: GetJournalEntryDTO): Promise<JournalEntry | null>;

  /**
   * Get all journal entries for a user within a date range
   */
  getEntriesByDateRange(data: JournalEntriesListDTO): Promise<JournalEntry[]>;

  /**
   * Delete a journal entry
   */
  deleteEntry(id: number): Promise<boolean>;

  /**
   * Get dates that have entries for a user (for calendar highlighting)
   */
  getEntryDates(userUid: string, year: number, month: number): Promise<Date[]>;
}

