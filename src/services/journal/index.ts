// Service container for journal service
// Following dependency injection pattern

import { JournalService } from './JournalService';
import { awsRdsJournalRepository } from '@/repositories/journal';

// Create service instance with injected repository (using singleton)
export const journalService = new JournalService(awsRdsJournalRepository);

