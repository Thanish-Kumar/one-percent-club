# Authentication Architecture

This directory contains the authentication service layer following clean architecture principles with proper separation of concerns.

## Architecture Overview

```
src/
├── models/
│   └── User.ts                    # Domain models
├── dto/
│   └── auth.ts                    # Data Transfer Objects
├── repositories/
│   └── auth/
│       ├── AuthRepository.ts      # Repository interface
│       └── FirebaseAuthRepository.ts # Firebase implementation
├── services/
│   └── auth/
│       ├── AuthService.ts         # Service layer
│       ├── index.ts               # Service container
│       └── README.md              # This file
└── components/
    └── auth/
        ├── LoginForm.tsx          # UI components
        └── SignupForm.tsx
```

## Layer Responsibilities

### 1. Models (`src/models/`)
- **Purpose**: Core business entities and domain objects
- **Contains**: User model with business rules and properties
- **Example**: `User` interface with uid, email, displayName, etc.

### 2. DTOs (`src/dto/`)
- **Purpose**: Data Transfer Objects for API communication
- **Contains**: Request/Response objects for authentication operations
- **Examples**: `LoginRequestDTO`, `SignupRequestDTO`, `AuthResponseDTO`

### 3. Repositories (`src/repositories/auth/`)
- **Purpose**: Data access layer abstraction
- **Contains**: 
  - `AuthRepository` interface defining data access contract
  - `FirebaseAuthRepository` concrete implementation
- **Benefits**: Easy to swap implementations (Firebase → Supabase, etc.)

### 4. Services (`src/services/auth/`)
- **Purpose**: Business logic layer
- **Contains**:
  - `AuthService` interface defining business operations
  - `AuthServiceImpl` concrete implementation
  - `index.ts` service container for dependency injection

### 5. Components (`src/components/auth/`)
- **Purpose**: UI layer
- **Contains**: React components that use services
- **Benefits**: Clean separation from business logic

## Design Principles

1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Interface Segregation**: Small, focused interfaces
3. **Single Responsibility**: Each layer has one reason to change
4. **Open/Closed**: Open for extension, closed for modification
5. **Dependency Injection**: Services injected via constructor

## Usage Examples

### Using the Service
```typescript
import { authService } from '@/services/auth';
import { LoginRequestDTO } from '@/dto/auth';

const loginRequest: LoginRequestDTO = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await authService.login(loginRequest);
```

### Adding a New Repository Implementation
```typescript
// 1. Implement the interface
export class SupabaseAuthRepository implements AuthRepository {
  // ... implementation
}

// 2. Update service container
const authService = createAuthService(new SupabaseAuthRepository());
```

## Session Management

The authentication system includes comprehensive session management:

### AuthContext (`src/contexts/AuthContext.tsx`)
- **Purpose**: Global session state management
- **Features**:
  - Real-time authentication state tracking
  - Automatic session initialization
  - Auth state change listeners
  - Loading states management
  - Navigation handling

### Route Protection (`src/components/auth/ProtectedRoute.tsx`)
- **ProtectedRoute**: Protects authenticated routes (dashboard, etc.)
- **PublicRoute**: Redirects authenticated users away from public routes (login, signup)
- **Features**:
  - Automatic redirects based on auth state
  - Loading states during auth checks
  - Clean separation of concerns

### Session Features
- **Persistent Sessions**: Firebase handles session persistence
- **Real-time Updates**: Auth state changes are reflected immediately
- **Automatic Redirects**: Users are redirected based on authentication status
- **Loading States**: Proper loading indicators during auth operations

## Benefits

1. **Testability**: Easy to mock repositories for unit testing
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to swap implementations
4. **Scalability**: Easy to add new features without affecting existing code
5. **Type Safety**: Full TypeScript support throughout all layers