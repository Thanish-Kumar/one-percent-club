import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { userService } from '@/services/user';

/**
 * API Route: POST /api/users/save
 * 
 * Purpose: Save user data to AWS RDS database
 * 
 * This is a server-side route that handles database operations.
 * It's called from the client-side AuthService after Firebase authentication.
 * 
 * Clean Architecture:
 * - API Route is in the Frameworks & Drivers layer
 * - It uses UserService (Use Case layer) to orchestrate the save
 * - UserService uses UserRepository (Data Access layer)
 * - This keeps business logic separate from framework concerns
 */
export async function POST(request: NextRequest) {
  try {
    // Parse user data from request body
    const userData: User = await request.json();

    // Validate required fields
    if (!userData.uid || !userData.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required user data (uid or email)' 
        },
        { status: 400 }
      );
    }

    console.log('Saving user to database:', userData.uid);

    // Use UserService to save user to RDS database
    // This runs on the server and can access the database
    const savedUser = await userService.syncUserWithDatabase(userData);

    console.log('User saved to database successfully:', savedUser.id);

    return NextResponse.json({ 
      success: true, 
      user: savedUser 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving user to database:', error);
    
    // Return error response
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to save user to database' 
    }, { status: 500 });
  }
}

