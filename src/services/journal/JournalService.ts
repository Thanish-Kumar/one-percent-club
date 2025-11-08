// Journal Service - Business logic layer
// Following clean architecture principles

import { JournalRepository } from '@/repositories/journal';
import { JournalEntry } from '@/models/JournalEntry';
import {
  CreateJournalEntryDTO,
  UpdateJournalEntryDTO,
  GetJournalEntryDTO,
  JournalEntriesListDTO,
  JournalEntryResponseDTO,
} from '@/dto/journal';

export class JournalService {
  constructor(private journalRepository: JournalRepository) {}

  /**
   * Save or update a journal entry
   */
  async saveEntry(data: CreateJournalEntryDTO): Promise<JournalEntryResponseDTO> {
    // Validate content
    if (!data.content.trim()) {
      throw new Error('Journal entry content cannot be empty');
    }

    // Validate date format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.entryDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const entry = await this.journalRepository.upsertEntry(data);
    return this.mapToResponseDTO(entry);
  }

  /**
   * Get a journal entry for a specific date
   */
  async getEntryByDate(data: GetJournalEntryDTO): Promise<JournalEntryResponseDTO | null> {
    const entry = await this.journalRepository.getEntryByDate(data);
    return entry ? this.mapToResponseDTO(entry) : null;
  }

  /**
   * Get journal entries within a date range
   */
  async getEntriesByDateRange(data: JournalEntriesListDTO): Promise<JournalEntryResponseDTO[]> {
    const entries = await this.journalRepository.getEntriesByDateRange(data);
    return entries.map(entry => this.mapToResponseDTO(entry));
  }

  /**
   * Delete a journal entry
   */
  async deleteEntry(id: number): Promise<boolean> {
    return await this.journalRepository.deleteEntry(id);
  }

  /**
   * Get dates that have entries for highlighting in calendar
   */
  async getEntryDates(userUid: string, year: number, month: number): Promise<string[]> {
    const dates = await this.journalRepository.getEntryDates(userUid, year, month);
    return dates.map(date => this.formatDateToISO(date));
  }

  /**
   * Calculate word count from content
   */
  calculateWordCount(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private mapToResponseDTO(entry: JournalEntry): JournalEntryResponseDTO {
    return {
      id: entry.id,
      userUid: entry.userUid,
      entryDate: this.formatDateToISO(entry.entryDate),
      content: entry.content,
      wordCount: entry.wordCount,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

