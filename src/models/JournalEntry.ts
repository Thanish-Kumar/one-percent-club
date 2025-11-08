// Domain model for journal entry following clean architecture
export interface JournalEntry {
  id: number;
  userUid: string;
  entryDate: Date;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  isProcessedForSolutions: boolean;
  isQueued: boolean;
}

