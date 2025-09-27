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
