import { createUserService, UserService, UserServiceImpl } from './UserService';
import { awsRdsUserRepository } from '@/repositories/user/AwsRdsUserRepository';

// Create UserService instance
// Note: This is used by the API route (server-side) and NOT directly by AuthService
// AuthService now calls the API route, which then uses this UserService
const userServiceInstance = createUserService(awsRdsUserRepository);

// Export convenience properties
export const userService = userServiceInstance;

// Re-export auth service for backward compatibility
export { authService, serviceContainer } from '@/services/auth';

// Export types
export { UserServiceImpl, createUserService };
export type { UserService };

