// Repository interface for Solution following clean architecture
import { Solution } from '@/models/Solution';
import { CreateSolutionDTO, GetSolutionsDTO } from '@/dto/solution';

export interface SolutionRepository {
  /**
   * Create a new solution entry
   */
  createSolution(data: CreateSolutionDTO): Promise<Solution>;

  /**
   * Get solutions by filters
   */
  getSolutions(filters: GetSolutionsDTO): Promise<Solution[]>;

  /**
   * Get a single solution by ID
   */
  getSolutionById(id: number): Promise<Solution | null>;

  /**
   * Get solutions by journal entry ID
   */
  getSolutionsByJournalEntry(journalEntryId: number): Promise<Solution[]>;

  /**
   * Delete a solution by ID
   */
  deleteSolution(id: number): Promise<boolean>;
}



