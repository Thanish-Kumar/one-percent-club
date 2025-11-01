// Data Transfer Objects for Journal Entry operations

export interface CreateJournalEntryDTO {
  userUid: string;
  entryDate: string; // ISO date string (YYYY-MM-DD)
  content: string;
  wordCount: number;
}

export interface UpdateJournalEntryDTO {
  content: string;
  wordCount: number;
}

export interface GetJournalEntryDTO {
  userUid: string;
  entryDate: string; // ISO date string (YYYY-MM-DD)
}

export interface JournalEntryResponseDTO {
  id: number;
  userUid: string;
  entryDate: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntriesListDTO {
  userUid: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  limit?: number;
}

