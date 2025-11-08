import { NextResponse } from 'next/server';
import { bothCrewsService } from '@/services/both-crews';

/**
 * GET /api/both-crews/status - Get both-crews processing queue status
 */
export async function GET() {
  try {
    const status = bothCrewsService.getQueueStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        queueSize: status.queueSize,
        isProcessing: status.isProcessing,
        message: status.queueSize === 0 
          ? 'No entries in queue' 
          : `${status.queueSize} entries waiting to be processed`,
      },
    });
  } catch (error: any) {
    console.error('Error getting both-crews status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get status',
      },
      { status: 500 }
    );
  }
}


