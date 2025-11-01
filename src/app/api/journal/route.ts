// API route for journal entries
// POST: Create/update journal entry
// GET: Get journal entries by date range

import { NextRequest, NextResponse } from 'next/server';
import { journalService } from '@/services/journal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, entryDate, content } = body;

    if (!userUid || !entryDate || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userUid, entryDate, content' },
        { status: 400 }
      );
    }

    // Calculate word count
    const wordCount = journalService.calculateWordCount(content);

    const entry = await journalService.saveEntry({
      userUid,
      entryDate,
      content,
      wordCount,
    });

    return NextResponse.json(entry, { status: 200 });
  } catch (error: any) {
    console.error('Error saving journal entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save journal entry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userUid = searchParams.get('userUid');
    const entryDate = searchParams.get('entryDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    if (!userUid) {
      return NextResponse.json(
        { error: 'Missing required parameter: userUid' },
        { status: 400 }
      );
    }

    // If entryDate is provided, get single entry
    if (entryDate) {
      const entry = await journalService.getEntryByDate({ userUid, entryDate });
      return NextResponse.json(entry, { status: 200 });
    }

    // Otherwise get entries by date range
    const entries = await journalService.getEntriesByDateRange({
      userUid,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(entries, { status: 200 });
  } catch (error: any) {
    console.error('Error getting journal entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve journal entries' },
      { status: 500 }
    );
  }
}

