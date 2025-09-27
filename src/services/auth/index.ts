import { createAuthService } from './AuthService';
import { firebaseAuthRepository } from '@/repositories/auth/FirebaseAuthRepository';
import { AuthService } from './AuthService';

// Service container - manages service instances and dependencies
class ServiceContainer {
  private static instance: ServiceContainer;
  private authService: AuthService | null = null;

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = createAuthService(firebaseAuthRepository);
    }
    return this.authService;
  }

  // Method to reset services (useful for testing)
  reset(): void {
    this.authService = null;
  }
}

// Export singleton instance and convenience methods
export const serviceContainer = ServiceContainer.getInstance();

// Convenience exports
export const authService = serviceContainer.getAuthService();
export { AuthService };
