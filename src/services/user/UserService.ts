import { UserRepository } from '@/repositories/user/UserRepository';
import { CreateUserRequestDTO, UpdateUserRequestDTO, UserDatabaseDTO, UserDatabaseErrorDTO } from '@/dto/user';
import { User } from '@/models/User';

// Service layer - contains business logic and orchestrates repository calls
export interface UserService {
  // User management operations
  createUser(userData: CreateUserRequestDTO): Promise<UserDatabaseDTO>;
  getUserByUid(uid: string): Promise<UserDatabaseDTO | null>;
  getUserById(id: number): Promise<UserDatabaseDTO | null>;
  updateUser(uid: string, updates: UpdateUserRequestDTO): Promise<UserDatabaseDTO>;
  deleteUser(uid: string): Promise<void>;
  getUsers(limit?: number, offset?: number): Promise<UserDatabaseDTO[]>;
  
  // Business logic methods
  syncUserWithDatabase(user: User): Promise<UserDatabaseDTO>;
  upsertUser(user: User): Promise<UserDatabaseDTO>;
}

export class UserServiceImpl implements UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserRequestDTO): Promise<UserDatabaseDTO> {
    // Business logic: Validate user data before creating
    if (!userData.uid) {
      throw new Error('User UID is required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.getUserByUid(userData.uid);
    if (existingUser) {
      return existingUser;
    }

    // Business logic: Set default values
    const userWithDefaults: CreateUserRequestDTO = {
      ...userData,
      emailVerified: userData.emailVerified ?? false,
    };

    return this.userRepository.createUser(userWithDefaults);
  }

  async getUserByUid(uid: string): Promise<UserDatabaseDTO | null> {
    return this.userRepository.getUserByUid(uid);
  }

  async getUserById(id: number): Promise<UserDatabaseDTO | null> {
    return this.userRepository.getUserById(id);
  }

  async updateUser(uid: string, updates: UpdateUserRequestDTO): Promise<UserDatabaseDTO> {
    // Business logic: Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    return this.userRepository.updateUser(uid, updates);
  }

  async deleteUser(uid: string): Promise<void> {
    // Business logic: Check if user exists before deleting
    const user = await this.userRepository.getUserByUid(uid);
    if (!user) {
      throw new Error('User not found');
    }

    return this.userRepository.deleteUser(uid);
  }

  async getUsers(limit: number = 100, offset: number = 0): Promise<UserDatabaseDTO[]> {
    // Business logic: Set reasonable limits
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const safeOffset = Math.max(offset, 0);

    return this.userRepository.getUsers(safeLimit, safeOffset);
  }

  async syncUserWithDatabase(user: User): Promise<UserDatabaseDTO> {
    // Business logic: Create a user record from Firebase User
    const userData: CreateUserRequestDTO = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      useCase: user.useCase,
      goal: user.goal,
      context: user.context,
    };

    return this.createUser(userData);
  }

  async upsertUser(user: User): Promise<UserDatabaseDTO> {
    // Business logic: Create or update user
    try {
      const existingUser = await this.userRepository.getUserByUid(user.uid);
      
      if (existingUser) {
        // Update existing user
        const updates: UpdateUserRequestDTO = {
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          useCase: user.useCase,
          goal: user.goal,
          context: user.context,
        };
        
        return this.updateUser(user.uid, updates);
      } else {
        // Create new user
        return this.syncUserWithDatabase(user);
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }
}

// Factory function to create service with repository
export const createUserService = (userRepository: UserRepository): UserService => {
  return new UserServiceImpl(userRepository);
};

