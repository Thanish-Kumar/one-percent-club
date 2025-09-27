import { User } from '@/models/User';
import { LoginRequestDTO, SignupRequestDTO, AuthResponseDTO, AuthErrorDTO } from '@/dto/auth';

// Repository interface - defines the contract for data access
export interface AuthRepository {
  // Authentication operations
  login(credentials: LoginRequestDTO): Promise<AuthResponseDTO>;
  signup(userData: SignupRequestDTO): Promise<AuthResponseDTO>;
  logout(): Promise<void>;
  
  // User management
  getCurrentUser(): Promise<User | null>;
  getUserById(uid: string): Promise<User | null>;
  updateUserProfile(uid: string, updates: Partial<User>): Promise<User>;
  
  // Auth state management
  onAuthStateChange(callback: (user: User | null) => void): () => void;
  getCurrentUserToken(): Promise<string | null>;
  
  // Error handling
  handleAuthError(error: any): AuthErrorDTO;
}
