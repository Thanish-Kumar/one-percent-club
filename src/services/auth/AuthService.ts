import { AuthRepository } from '@/repositories/auth/AuthRepository';
import { LoginRequestDTO, SignupRequestDTO, AuthResponseDTO, AuthErrorDTO } from '@/dto/auth';
import { User } from '@/models/User';

// Service layer - contains business logic and orchestrates repository calls
export interface AuthService {
  login(credentials: LoginRequestDTO): Promise<AuthResponseDTO>;
  signup(userData: SignupRequestDTO): Promise<AuthResponseDTO>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  getUserById(uid: string): Promise<User | null>;
  updateUserProfile(uid: string, updates: Partial<User>): Promise<User>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
  getCurrentUserToken(): Promise<string | null>;
}

export class AuthServiceImpl implements AuthService {
  constructor(
    private authRepository: AuthRepository
  ) {}

  async login(credentials: LoginRequestDTO): Promise<AuthResponseDTO> {
    // Add any business logic here (e.g., logging, analytics, validation)
    const response = await this.authRepository.login(credentials);
    
    // Business rule: Determine where to redirect based on user state
    if (response.user.emailVerified) {
      response.navigationIntent = {
        redirectTo: '/dashboard',
        reason: 'verified_user_login'
      };
    } else {
      response.navigationIntent = {
        redirectTo: '/verify-email',
        reason: 'unverified_user_login'
      };
    }
    
    return response;
  }

  async signup(userData: SignupRequestDTO): Promise<AuthResponseDTO> {
    // Add any business logic here (e.g., validation, logging, analytics)
    const response = await this.authRepository.signup(userData);
    
    // Business rule: Save user to RDS database after Firebase authentication
    // Call API route instead of direct UserService call to handle server-side database operations
    try {
      const apiResponse = await fetch('/api/users/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(response.user),
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('User synced to database:', result.user);
      } else {
        console.error('Failed to save user to database:', await apiResponse.text());
      }
    } catch (error) {
      console.error('Failed to sync user to database:', error);
      // Don't fail the signup if database sync fails - user is still authenticated
    }
    
    // Business rule: New users always go to dashboard (could be onboarding later)
    response.navigationIntent = {
      redirectTo: '/dashboard',
      reason: 'new_user_signup'
    };
    
    return response;
  }

  async logout(): Promise<void> {
    // Add any business logic here (e.g., cleanup, logging)
    return this.authRepository.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    return this.authRepository.getCurrentUser();
  }

  async getUserById(uid: string): Promise<User | null> {
    return this.authRepository.getUserById(uid);
  }

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
    // Add any business logic here (e.g., validation, logging)
    return this.authRepository.updateUserProfile(uid, updates);
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return this.authRepository.onAuthStateChange(callback);
  }

  async getCurrentUserToken(): Promise<string | null> {
    return this.authRepository.getCurrentUserToken();
  }
}

// Factory function to create service with repository
export const createAuthService = (authRepository: AuthRepository): AuthService => {
  return new AuthServiceImpl(authRepository);
};
