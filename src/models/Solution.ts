// Domain model for solution following clean architecture
export interface Solution {
  id: number;
  userUid: string;
  entryDate: Date;
  journalEntryId: number;
  solution: any; // JSONB data from the both-crews API
  createdAt: Date;
}

