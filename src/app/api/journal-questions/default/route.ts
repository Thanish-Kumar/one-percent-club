import { NextRequest, NextResponse } from "next/server"
import { getJournalQuestionRepository } from "@/repositories/journal-question"

/**
 * GET /api/journal-questions/default
 * Get the default question template
 */
export async function GET(request: NextRequest) {
  try {
    const repository = getJournalQuestionRepository()
    const defaultQuestions = await repository.getDefaultQuestionSet()

    return NextResponse.json({
      success: true,
      questions: defaultQuestions
    })
  } catch (error) {
    console.error("Error fetching default questions:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch default questions" 
      },
      { status: 500 }
    )
  }
}

