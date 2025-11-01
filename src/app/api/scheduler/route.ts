import { NextRequest, NextResponse } from 'next/server';
import { crewSchedulerService } from '@/services/scheduler';

/**
 * GET /api/scheduler - Get scheduler status
 */
export async function GET() {
  try {
    const status = crewSchedulerService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get scheduler status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler - Start or control the scheduler
 * Body: { action: 'start' | 'stop' | 'run-now', intervalMinutes?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intervalMinutes } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required. Valid actions: start, stop, run-now',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        if (!intervalMinutes || intervalMinutes <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'intervalMinutes is required and must be greater than 0',
            },
            { status: 400 }
          );
        }

        crewSchedulerService.start(intervalMinutes);
        
        return NextResponse.json({
          success: true,
          message: `Scheduler started with interval: ${intervalMinutes} minutes`,
          data: crewSchedulerService.getStatus(),
        });

      case 'stop':
        crewSchedulerService.stop();
        
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped',
          data: crewSchedulerService.getStatus(),
        });

      case 'run-now':
        await crewSchedulerService.runNow();
        
        return NextResponse.json({
          success: true,
          message: 'Scheduler task executed manually',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Valid actions: start, stop, run-now',
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to control scheduler',
      },
      { status: 500 }
    );
  }
}

