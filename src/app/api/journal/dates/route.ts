// API route for getting dates that have journal entries
// Used for highlighting dates in calendar

import { NextRequest, NextResponse } from 'next/server';
import { journalService } from '@/services/journal';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userUid = searchParams.get('userUid');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!userUid || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required parameters: userUid, year, month' },
        { status: 400 }
      );
    }

    const dates = await journalService.getEntryDates(
      userUid,
      parseInt(year),
      parseInt(month)
    );

    return NextResponse.json({ dates }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting entry dates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve entry dates' },
      { status: 500 }
    );
  }
}

