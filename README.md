# 1% Club - Clean Architecture Implementation

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and implemented using **Clean Architecture** principles.

## Architecture Overview

This project follows **Uncle Bob's Clean Architecture** methodology, ensuring separation of concerns, testability, and maintainability. The architecture is organized into distinct layers with clear dependencies flowing inward.

### Project Structure

```
src/
├── models/                    # Domain Entities (Core Business Objects)
│   └── User.ts
├── dto/                       # Data Transfer Objects
│   └── auth.ts
├── repositories/              # Repository Interfaces & Implementations
│   └── auth/
│       ├── AuthRepository.ts      # Interface (Contract)
│       └── FirebaseAuthRepository.ts # Implementation
├── services/                  # Use Cases (Business Logic)
│   └── auth/
│       ├── AuthService.ts         # Interface & Implementation
│       ├── index.ts              # Service Container (DI)
│       └── README.md             # Detailed Architecture Docs
├── contexts/                  # Application State Management
│   └── AuthContext.tsx
├── components/               # UI Layer (Frameworks & Drivers)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── ui/                   # Reusable UI Components
└── lib/                      # External Dependencies
    ├── firebase.ts
    └── utils.ts
```

## Clean Architecture Layers

### 1. **Entities (Domain Models)** - `src/models/`
- **Purpose**: Core business objects and rules
- **Contains**: `User` interface with business properties
- **Characteristics**: 
  - Framework-independent
  - Contains only business logic
  - No dependencies on external layers

### 2. **Use Cases (Services)** - `src/services/`
- **Purpose**: Application-specific business rules
- **Contains**: `AuthService` interface and implementation
- **Responsibilities**:
  - Orchestrates data flow
  - Implements business logic
  - Manages navigation intent
  - Depends only on entities and repository interfaces

### 3. **Interface Adapters (Repositories)** - `src/repositories/`
- **Purpose**: Data access abstraction
- **Contains**: 
  - `AuthRepository` interface (contract)
  - `FirebaseAuthRepository` implementation
- **Benefits**:
  - Easy to swap implementations
  - Testable with mocks
  - Framework-agnostic interface

### 4. **Frameworks & Drivers (UI)** - `src/components/`
- **Purpose**: External interfaces (UI, APIs, Database)
- **Contains**: React components, Firebase configuration
- **Characteristics**:
  - Depends on use cases
  - Handles user interaction
  - Manages presentation logic

## Key Design Principles

### 1. **Dependency Inversion Principle**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Example: `AuthService` depends on `AuthRepository` interface, not Firebase directly

### 2. **Single Responsibility Principle**
- Each layer has one reason to change
- `AuthService` handles business logic only
- `FirebaseAuthRepository` handles Firebase-specific operations only

### 3. **Interface Segregation**
- Small, focused interfaces
- `AuthRepository` defines only authentication-related operations
- Easy to implement and test

### 4. **Dependency Injection**
- Services injected via constructor
- Managed by `ServiceContainer` singleton
- Enables easy testing and swapping implementations

## Implementation Examples

### Service Layer Usage
```typescript
import { authService } from '@/services/auth';
import { LoginRequestDTO } from '@/dto/auth';

const loginRequest: LoginRequestDTO = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await authService.login(loginRequest);
// Service handles business logic and navigation intent
```

### Repository Pattern
```typescript
// Interface defines contract
export interface AuthRepository {
  login(credentials: LoginRequestDTO): Promise<AuthResponseDTO>;
  // ... other methods
}

// Implementation handles specific technology
export class FirebaseAuthRepository implements AuthRepository {
  async login(credentials: LoginRequestDTO): Promise<AuthResponseDTO> {
    // Firebase-specific implementation
  }
}
```

### Dependency Injection Container
```typescript
// Service container manages dependencies
class ServiceContainer {
  getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = createAuthService(firebaseAuthRepository);
    }
    return this.authService;
  }
}
```

## Benefits of This Architecture

### 1. **Testability**
- Easy to mock repositories for unit testing
- Business logic isolated from external dependencies
- Clear separation enables focused testing

### 2. **Maintainability**
- Clear separation of concerns
- Changes in one layer don't affect others
- Easy to understand and modify

### 3. **Flexibility**
- Easy to swap implementations (Firebase → Supabase)
- Add new features without affecting existing code
- Framework-independent business logic

### 4. **Scalability**
- Easy to add new services and repositories
- Consistent patterns across the application
- Supports team development

### 5. **Type Safety**
- Full TypeScript support throughout all layers
- Compile-time error checking
- IntelliSense support

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Firebase project setup

### Installation
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup
1. Copy `env.example` to `.env.local`
2. Add your Firebase configuration
3. See `FIREBASE_SETUP.md` for detailed setup instructions

### Development
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture Documentation

For detailed architecture documentation, see:
- [Authentication Service Architecture](./src/services/auth/README.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)

## Learn More

### Clean Architecture Resources
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.