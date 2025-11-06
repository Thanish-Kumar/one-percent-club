import { NextRequest, NextResponse } from "next/server"
import { getJournalQuestionRepository } from "@/repositories/journal-question"

/**
 * GET /api/journal-questions
 * Fetch question set for a specific user and date
 * 
 * Query params:
 * - userUid: string (required)
 * - entryDate: string (required) - ISO date format (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userUid = searchParams.get("userUid")
    const entryDate = searchParams.get("entryDate")

    if (!userUid) {
      return NextResponse.json(
        { success: false, error: "userUid is required" },
        { status: 400 }
      )
    }

    if (!entryDate) {
      return NextResponse.json(
        { success: false, error: "entryDate is required" },
        { status: 400 }
      )
    }

    const repository = getJournalQuestionRepository()
    
    // Check if custom question set exists for this user and date
    const existingSet = await repository.getQuestionSetByUserAndDate(userUid, entryDate)
    
    let questions
    let isDefault = false
    
    if (existingSet) {
      // User has custom questions for this date
      questions = existingSet.questions
      isDefault = false
      console.log(`✅ Found existing question set for user ${userUid} on ${entryDate}`)
    } else {
      // Return default template WITHOUT creating a new row in database
      questions = await repository.getDefaultQuestionSet()
      isDefault = true
      console.log(`📋 Returning default template for user ${userUid} on ${entryDate} (not saved to database)`)
    }

    return NextResponse.json({
      success: true,
      questions: questions,
      isDefault: isDefault,
      userUid: userUid,
      entryDate: entryDate
    })
  } catch (error) {
    console.error("Error fetching journal questions:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch journal questions" 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/journal-questions
 * DISABLED: Questions are read-only for users
 * Only the default template can be modified by administrators directly in the database
 * User entries/answers are saved to the journal_entries table, NOT here
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      error: "Question modification is not allowed. Questions are read-only. User entries should be saved to /api/journal endpoint." 
    },
    { status: 403 }
  )
}
