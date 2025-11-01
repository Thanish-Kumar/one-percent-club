// DTOs for crew response operations

// Database DTO - represents how the data is stored in the database
export interface CrewResponseDatabaseDTO {
  id: number;
  userUid: string;
  requestContext?: string;
  requestGoal?: string;
  responseData: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

// Request DTO for creating a new crew response
export interface CreateCrewResponseRequestDTO {
  userUid: string;
  requestContext?: string;
  requestGoal?: string;
  responseData: Record<string, any>;
}

// Database error DTO
export interface CrewResponseDatabaseErrorDTO {
  code: string;
  message: string;
  details: string;
}

// Query parameters for fetching crew responses
export interface GetCrewResponsesQueryDTO {
  userUid?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

