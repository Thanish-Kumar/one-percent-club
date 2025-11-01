// Domain model for crew API responses
export interface CrewResponse {
  id?: number;
  userUid: string;
  requestContext?: string;
  requestGoal?: string;
  responseData: Record<string, any>;
  createdAt?: Date;
}

