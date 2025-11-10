// Data Transfer Objects for user database operations

import { User } from '@/models/User';

export interface CreateUserRequestDTO {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string;
  lastName?: string;
  photoURL: string | null;
  emailVerified: boolean;
  useCase?: 'Personal Growth' | 'Professional Growth' | 'Own Business Growth';
  goal?: 'Sustainable growth' | 'Rapid growth';
  context?: string;
}

export interface UpdateUserRequestDTO {
  email?: string | null;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
  photoURL?: string | null;
  emailVerified?: boolean;
  useCase?: 'Personal Growth' | 'Professional Growth' | 'Own Business Growth';
  goal?: 'Sustainable growth' | 'Rapid growth';
  context?: string;
}

export interface UserDatabaseDTO extends User {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDatabaseErrorDTO {
  code: string;
  message: string;
  details?: string;
}

