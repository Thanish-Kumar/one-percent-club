import { AwsRdsJournalQuestionRepository } from "./AwsRdsJournalQuestionRepository"
import { JournalQuestionRepository } from "./JournalQuestionRepository"
import { getDatabasePool } from "@/lib/database"

let journalQuestionRepository: JournalQuestionRepository

export function getJournalQuestionRepository(): JournalQuestionRepository {
  if (!journalQuestionRepository) {
    const pool = getDatabasePool()
    journalQuestionRepository = new AwsRdsJournalQuestionRepository(pool)
  }
  return journalQuestionRepository
}

