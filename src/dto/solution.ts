// DTOs for Solution operations
export interface CreateSolutionDTO {
  userUid: string;
  entryDate: string; // ISO date format YYYY-MM-DD
  journalEntryId: number;
  solution: any; // JSONB data
}

export interface GetSolutionsDTO {
  userUid?: string;
  entryDate?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}


