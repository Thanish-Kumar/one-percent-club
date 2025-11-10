// Data Transfer Objects for authentication requests and responses

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface SignupRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  useCase: 'Personal Growth' | 'Professional Growth' | 'Own Business Growth';
  goal: 'Sustainable growth' | 'Rapid growth';
  context: string;
}

export interface AuthResponseDTO {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    firstName?: string;
    lastName?: string;
    photoURL: string | null;
    emailVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
  token?: string;
  navigationIntent?: {
    redirectTo: string;
    reason: string;
  };
}

export interface UserProfileDTO {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string;
  lastName?: string;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthErrorDTO {
  code: string;
  message: string;
  details?: string;
}
