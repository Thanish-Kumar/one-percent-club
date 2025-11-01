// Repository interface for crew responses
import { 
  CrewResponseDatabaseDTO, 
  CreateCrewResponseRequestDTO,
  GetCrewResponsesQueryDTO,
  CrewResponseDatabaseErrorDTO
} from '@/dto/crew-response';

export interface CrewResponseRepository {
  /**
   * Create a new crew response record
   */
  createCrewResponse(data: CreateCrewResponseRequestDTO): Promise<CrewResponseDatabaseDTO>;

  /**
   * Upsert crew response - Insert or Update for the same user on the same day
   * This ensures only one entry per user per day
   */
  upsertCrewResponse(data: CreateCrewResponseRequestDTO): Promise<CrewResponseDatabaseDTO>;

  /**
   * Get crew responses by user UID
   */
  getCrewResponsesByUserUid(userUid: string, limit?: number, offset?: number): Promise<CrewResponseDatabaseDTO[]>;

  /**
   * Get a single crew response by ID
   */
  getCrewResponseById(id: number): Promise<CrewResponseDatabaseDTO | null>;

  /**
   * Get crew responses with query parameters
   */
  getCrewResponses(query: GetCrewResponsesQueryDTO): Promise<CrewResponseDatabaseDTO[]>;

  /**
   * Delete a crew response by ID
   */
  deleteCrewResponse(id: number): Promise<void>;

  /**
   * Delete all crew responses for a user
   */
  deleteCrewResponsesByUserUid(userUid: string): Promise<void>;

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any): CrewResponseDatabaseErrorDTO;
}

