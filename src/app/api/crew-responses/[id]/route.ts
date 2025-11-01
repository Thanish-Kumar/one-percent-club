import { NextRequest, NextResponse } from 'next/server';
import { awsRdsCrewResponseRepository } from '@/repositories/crew-response/AwsRdsCrewResponseRepository';

/**
 * GET /api/crew-responses/[id] - Get a single crew response by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
        },
        { status: 400 }
      );
    }

    const response = await awsRdsCrewResponseRepository.getCrewResponseById(id);

    if (!response) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crew response not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error fetching crew response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch crew response',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crew-responses/[id] - Delete a crew response by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
        },
        { status: 400 }
      );
    }

    await awsRdsCrewResponseRepository.deleteCrewResponse(id);

    return NextResponse.json({
      success: true,
      message: 'Crew response deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting crew response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete crew response',
      },
      { status: 500 }
    );
  }
}

