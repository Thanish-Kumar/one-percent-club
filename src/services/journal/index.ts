// Service container for journal service
// Following dependency injection pattern

import { JournalService } from './JournalService';
import { AwsRdsJournalRepository } from '@/repositories/journal/AwsRdsJournalRepository';

// Create repository instance
const journalRepository = new AwsRdsJournalRepository();

// Create service instance with injected repository
export const journalService = new JournalService(journalRepository);

