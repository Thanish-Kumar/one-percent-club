import { NextRequest, NextResponse } from 'next/server';
import { awsRdsSolutionRepository } from '@/repositories/solution/AwsRdsSolutionRepository';
import { GetSolutionsDTO } from '@/dto/solution';

/**
 * GET /api/solutions - Get solutions with optional filters
 * Query params: userUid, entryDate, startDate, endDate, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: GetSolutionsDTO = {
      userUid: searchParams.get('userUid') || undefined,
      entryDate: searchParams.get('entryDate') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const solutions = await awsRdsSolutionRepository.getSolutions(filters);

    return NextResponse.json({
      success: true,
      data: solutions,
      count: solutions.length,
    });
  } catch (error: any) {
    console.error('Error getting solutions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get solutions',
      },
      { status: 500 }
    );
  }
}

