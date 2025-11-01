// API route for individual journal entry operations
// DELETE: Delete a journal entry by ID

import { NextRequest, NextResponse } from 'next/server';
import { journalService } from '@/services/journal';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const success = await journalService.deleteEntry(id);

    if (success) {
      return NextResponse.json(
        { message: 'Entry deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}

