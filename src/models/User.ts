// Domain models - core business entities
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string;
  lastName?: string;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  useCase?: 'Personal Growth' | 'Professional Growth' | 'Own Business Growth';
  goal?: 'Sustainable growth' | 'Rapid growth';
  context?: string;
}

// Firebase-specific user model (extends base User)
export interface FirebaseUser extends User {
  // Additional Firebase-specific properties can be added here
  customClaims?: Record<string, any>;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}
