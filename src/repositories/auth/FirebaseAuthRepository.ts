import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthRepository } from './AuthRepository';
import { User } from '@/models/User';
import { LoginRequestDTO, SignupRequestDTO, AuthResponseDTO, AuthErrorDTO } from '@/dto/auth';

// Helper function to convert Firebase user to our User model
const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
    updatedAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : undefined,
  };
};

// Helper function to handle Firebase auth errors
const handleFirebaseError = (error: any): AuthErrorDTO => {
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'An unknown error occurred';
  
  // Map common Firebase error codes to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email.',
  };

  return {
    code: errorCode,
    message: errorMessages[errorCode] || errorMessage,
    details: errorCode,
  };
};

export class FirebaseAuthRepository implements AuthRepository {
  async login(credentials: LoginRequestDTO): Promise<AuthResponseDTO> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      const user = mapFirebaseUserToUser(userCredential.user);
      const token = await userCredential.user.getIdToken();
      
      return { user, token };
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  async signup(userData: SignupRequestDTO): Promise<AuthResponseDTO> {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Get the updated user
      const user = mapFirebaseUserToUser(userCredential.user);
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      
      const token = await userCredential.user.getIdToken();

      return { user, token };
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          resolve(mapFirebaseUserToUser(firebaseUser));
        } else {
          resolve(null);
        }
      });
    });
  }

  async getUserById(uid: string): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      return mapFirebaseUserToUser(currentUser);
    }
    return null;
  }

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error('User not found or not authenticated');
    }

    try {
      const profileUpdates: any = {};
      
      if (updates.displayName) {
        profileUpdates.displayName = updates.displayName;
      }
      
      if (updates.photoURL) {
        profileUpdates.photoURL = updates.photoURL;
      }

      await updateProfile(currentUser, profileUpdates);
      return mapFirebaseUserToUser(currentUser);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(mapFirebaseUserToUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }

  async getCurrentUserToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error('Error getting user token:', error);
        return null;
      }
    }
    return null;
  }

  handleAuthError(error: any): AuthErrorDTO {
    return handleFirebaseError(error);
  }
}

// Export singleton instance
export const firebaseAuthRepository = new FirebaseAuthRepository();
