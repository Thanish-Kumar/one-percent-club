import { User } from '@/models/User';
import { CreateUserRequestDTO, UpdateUserRequestDTO, UserDatabaseDTO, UserDatabaseErrorDTO } from '@/dto/user';

// Repository interface - defines the contract for user data access
export interface UserRepository {
  // User CRUD operations
  createUser(userData: CreateUserRequestDTO): Promise<UserDatabaseDTO>;
  getUserByUid(uid: string): Promise<UserDatabaseDTO | null>;
  getUserById(id: number): Promise<UserDatabaseDTO | null>;
  updateUser(uid: string, updates: UpdateUserRequestDTO): Promise<UserDatabaseDTO>;
  deleteUser(uid: string): Promise<void>;
  
  // Batch operations
  getUsers(limit?: number, offset?: number): Promise<UserDatabaseDTO[]>;
  
  // Error handling
  handleDatabaseError(error: any): UserDatabaseErrorDTO;
}

