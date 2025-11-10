# User Service - AWS RDS Integration

This service handles user data persistence to AWS RDS PostgreSQL database, following Clean Architecture principles.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer (React)                     │
│              AuthContext → UserContext                   │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                 Service Layer (Use Cases)                │
│  ┌──────────────────┐      ┌─────────────────┐          │
│  │   AuthService    │ ───▶ │  UserService    │          │
│  └──────────────────┘      └─────────────────┘          │
│                                                           │
│  - Orchestrates auth flow                                │
│  - Saves users to RDS after signup                       │
│  - Manages user profiles                                 │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│              Repository Layer (Data Access)               │
│  ┌──────────────────────────────────────────────────┐    │
│  │         UserRepository (Interface)               │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │   AwsRdsUserRepository (Implementation)   │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│           External Framework (AWS RDS PostgreSQL)         │
└───────────────────────────────────────────────────────────┘
```

## Clean Architecture Implementation

### 1. **Entities (Models)** - `src/models/`
- `User.ts` - Core user business object

### 2. **DTOs** - `src/dto/`
- `user.ts` - Data transfer objects for database operations
  - `CreateUserRequestDTO` - For creating users
  - `UpdateUserRequestDTO` - For updating users
  - `UserDatabaseDTO` - Database user representation
  - `UserDatabaseErrorDTO` - Error handling

### 3. **Repository Layer** - `src/repositories/user/`
- **Interface**: `UserRepository.ts`
  - Defines contract for data access operations
  - Technology-agnostic
  
- **Implementation**: `AwsRdsUserRepository.ts`
  - PostgreSQL-specific implementation
  - Uses connection pool for efficiency
  - Handles database errors gracefully

### 4. **Service Layer (Use Cases)** - `src/services/user/`
- **UserService.ts** - Business logic layer
  - `createUser()` - Creates new users with validation
  - `getUserByUid()` - Retrieves user by UID
  - `updateUser()` - Updates user profile
  - `deleteUser()` - Removes user
  - `syncUserWithDatabase()` - Syncs Firebase user to RDS
  - `upsertUser()` - Creates or updates user

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    use_case VARCHAR(50) CHECK (use_case IN ('Personal Growth', 'Professional Growth', 'Own Business Growth')),
    goal VARCHAR(50) CHECK (goal IN ('Sustainable growth', 'Rapid growth')),
    context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features

### 1. **Automatic User Sync**
Users are automatically saved to RDS after Firebase signup:
```typescript
// In AuthService.signup()
const response = await this.authRepository.signup(userData);
await this.userService.syncUserWithDatabase(response.user);
```

### 2. **Connection Pool Management**
- Efficient connection pooling
- Automatic reconnection
- SSL support for AWS RDS

### 3. **Error Handling**
- Graceful error mapping
- User-friendly error messages
- Detailed logging

### 4. **Type Safety**
- Full TypeScript support
- Compile-time type checking
- IntelliSense support

## Usage Examples

### Create a User
```typescript
import { userService } from '@/services/user';

const userData = {
  uid: 'firebase-uid-123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
};

const createdUser = await userService.createUser(userData);
```

### Get User by UID
```typescript
const user = await userService.getUserByUid('firebase-uid-123');
```

### Update User Profile
```typescript
const updates = {
  firstName: 'Jane',
  lastName: 'Smith',
  photoURL: 'https://example.com/avatar.jpg',
};

const updatedUser = await userService.updateUser('firebase-uid-123', updates);
```

### Sync Firebase User to Database
```typescript
const firebaseUser: User = {
  uid: 'uid-123',
  email: 'user@example.com',
  // ... other fields
};

const dbUser = await userService.syncUserWithDatabase(firebaseUser);
```

## Environment Variables

Add to your `.env.local` file:
```bash
# AWS RDS Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=oneprocentclub
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SSL=true
```

## Setup Instructions

### 1. Create AWS RDS PostgreSQL Instance
1. Go to AWS RDS Console
2. Create a new PostgreSQL database
3. Note the endpoint, port, and credentials
4. Update `.env.local` with your RDS details

### 2. Run Database Migration
```bash
npm run db:migrate
```

This creates the `users` table with all necessary indexes and triggers.

### 3. Test Database Connection
```bash
npm run db:test
```

### 4. Start Development Server
```bash
npm run dev
```

## Integration with Auth

The UserService is automatically integrated with AuthService:
1. User signs up via Firebase Auth
2. AuthService creates user in Firebase
3. AuthService saves user details to AWS RDS
4. User can access dashboard

## Benefits

### 1. **Separation of Concerns**
- Authentication handled by Firebase
- Data persistence handled by RDS
- Clear boundaries between layers

### 2. **Flexibility**
- Easy to swap RDS for another database
- Can add more storage systems (e.g., S3 for files)
- Firebase can be replaced if needed

### 3. **Scalability**
- Connection pooling handles high load
- Database indexes optimize queries
- AWS RDS provides managed scaling

### 4. **Data Consistency**
- Single source of truth in database
- Firebase for authentication
- RDS for detailed user profiles

## Testing

```typescript
// Example: Test user creation
import { userService } from '@/services/user';

test('should create user in database', async () => {
  const user = await userService.createUser({
    uid: 'test-uid',
    email: 'test@example.com',
    // ...
  });
  
  expect(user.uid).toBe('test-uid');
});
```

## Troubleshooting

### Connection Issues
- Verify AWS RDS endpoint is correct
- Check security groups allow connections
- Ensure credentials are correct in `.env.local`

### Migration Issues
- Ensure database exists before running migration
- Check permissions for database user
- Review migration file for syntax errors

## Next Steps

- [ ] Add more user fields as needed
- [ ] Implement user profile image storage (S3)
- [ ] Add user preferences and settings
- [ ] Implement user activity logging
- [ ] Add database backups and monitoring

