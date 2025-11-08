import { NextRequest, NextResponse } from 'next/server';
import { awsRdsSolutionRepository } from '@/repositories/solution/AwsRdsSolutionRepository';

/**
 * GET /api/solutions/[id] - Get a single solution by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid solution ID',
        },
        { status: 400 }
      );
    }

    const solution = await awsRdsSolutionRepository.getSolutionById(id);

    if (!solution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Solution not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: solution,
    });
  } catch (error: any) {
    console.error('Error getting solution:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get solution',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/solutions/[id] - Delete a solution by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid solution ID',
        },
        { status: 400 }
      );
    }

    const deleted = await awsRdsSolutionRepository.deleteSolution(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Solution not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Solution deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting solution:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete solution',
      },
      { status: 500 }
    );
  }
}


