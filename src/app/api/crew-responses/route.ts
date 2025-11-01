import { NextRequest, NextResponse } from 'next/server';
import { awsRdsCrewResponseRepository } from '@/repositories/crew-response/AwsRdsCrewResponseRepository';

/**
 * GET /api/crew-responses - Get crew responses with optional filters
 * Query params: userUid, limit, offset, startDate, endDate
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userUid = searchParams.get('userUid');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {
      limit,
      offset,
    };

    if (userUid) {
      query.userUid = userUid;
    }

    if (startDate) {
      query.startDate = new Date(startDate);
    }

    if (endDate) {
      query.endDate = new Date(endDate);
    }

    const responses = await awsRdsCrewResponseRepository.getCrewResponses(query);

    return NextResponse.json({
      success: true,
      data: responses,
      count: responses.length,
    });
  } catch (error: any) {
    console.error('Error fetching crew responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch crew responses',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crew-responses - Create a new crew response (manual)
 * Body: { userUid: string, requestContext?: string, requestGoal?: string, responseData: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, requestContext, requestGoal, responseData } = body;

    if (!userUid || !responseData) {
      return NextResponse.json(
        {
          success: false,
          error: 'userUid and responseData are required',
        },
        { status: 400 }
      );
    }

    const crewResponse = await awsRdsCrewResponseRepository.createCrewResponse({
      userUid,
      requestContext,
      requestGoal,
      responseData,
    });

    return NextResponse.json({
      success: true,
      data: crewResponse,
    });
  } catch (error: any) {
    console.error('Error creating crew response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create crew response',
      },
      { status: 500 }
    );
  }
}

