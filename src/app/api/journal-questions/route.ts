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
    
    // Get or create question set for the user and date
    const questionSet = await repository.getOrCreateQuestionSet(userUid, entryDate)

    return NextResponse.json({
      success: true,
      questions: questionSet.questions
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
 * Create or update a question set for a user and date
 * 
 * Body:
 * - userUid: string
 * - entryDate: string (ISO date format)
 * - questions: Question[]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userUid, entryDate, questions } = body

    if (!userUid || !entryDate || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: userUid, entryDate, questions" 
        },
        { status: 400 }
      )
    }

    const repository = getJournalQuestionRepository()
    
    // Check if question set already exists
    const existing = await repository.getQuestionSetByUserAndDate(userUid, entryDate)
    
    let questionSet
    
    if (existing) {
      // Update existing question set
      questionSet = await repository.updateQuestionSet(userUid, entryDate, { questions })
    } else {
      // Create new question set
      questionSet = await repository.createQuestionSet({
        userUid,
        entryDate,
        questions
      })
    }

    return NextResponse.json({
      success: true,
      questionSet: {
        id: questionSet?.id,
        userUid: questionSet?.userUid,
        entryDate: questionSet?.entryDate,
        questions: questionSet?.questions
      }
    })
  } catch (error) {
    console.error("Error creating/updating journal question set:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create/update journal question set" 
      },
      { status: 500 }
    )
  }
}
