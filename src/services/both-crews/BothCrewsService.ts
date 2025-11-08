import { awsRdsJournalRepository } from '@/repositories/journal';
import { awsRdsSolutionRepository } from '@/repositories/solution';
import { JournalEntry } from '@/models/JournalEntry';

interface BothCrewsApiRequestBody {
  qna_pairs: string;
}

interface BothCrewsApiResponse {
  [key: string]: any;
}

interface ProcessingJob {
  entry: JournalEntry;
  retries: number;
}

export class BothCrewsService {
  private static instance: BothCrewsService;
  private bothCrewsApiUrl: string = process.env.BOTH_CREWS_API_URL || 'http://localhost:8000/api/v1/both-crews';
  private processingQueue: ProcessingJob[] = [];
  private isProcessing: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 600000; // 10 minutes

  private constructor() {
    // Start the background processor
    this.startBackgroundProcessor();
  }

  static getInstance(): BothCrewsService {
    if (!BothCrewsService.instance) {
      BothCrewsService.instance = new BothCrewsService();
    }
    return BothCrewsService.instance;
  }

  /**
   * Process unprocessed journal entries for the current day
   * This is called by the scheduler and runs asynchronously in the background
   */
  async processTodayEntries(): Promise<void> {
    try {
      const today = this.formatDateToISO(new Date());
      console.log(`[${new Date().toISOString()}] Queueing both-crews processing for ${today}...`);

      // Get all unprocessed entries for today
      const unprocessedEntries = await awsRdsJournalRepository.getUnprocessedEntriesForDate(today);
      
      console.log(`Found ${unprocessedEntries.length} unprocessed entries for ${today}`);

      if (unprocessedEntries.length === 0) {
        console.log('No unprocessed entries found. Skipping this run.');
        return;
      }

      // Add entries to the processing queue (non-blocking)
      for (const entry of unprocessedEntries) {
        await this.addToQueue(entry);
      }

      console.log(`✅ Added ${unprocessedEntries.length} entries to background processing queue`);
      console.log(`📊 Current queue size: ${this.processingQueue.length} entries`);
    } catch (error) {
      console.error('Error queueing both-crews processing:', error);
    }
  }

  /**
   * Add an entry to the processing queue
   */
  private async addToQueue(entry: JournalEntry): Promise<void> {
    // Check if entry is already in queue
    const alreadyQueued = this.processingQueue.some(job => job.entry.id === entry.id);
    
    if (!alreadyQueued) {
      // Mark entry as queued in the database
      await awsRdsJournalRepository.markEntryAsQueued(entry.id);
      
      this.processingQueue.push({
        entry,
        retries: 0,
      });
      
      console.log(`📝 Marked entry ${entry.id} as queued`);
    }
  }

  /**
   * Start the background processor that runs continuously
   * Processes queue entries sequentially in a separate async flow
   */
  private startBackgroundProcessor(): void {
    // Process queue every 2 seconds
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const job = this.processingQueue.shift();
        if (job) {
          await this.processEntry(job);
        }
      } catch (error) {
        console.error('Error in background processor:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 2000);

    console.log('🚀 Both-crews background processor started');
  }

  /**
   * Process a single journal entry
   */
  private async processEntry(job: ProcessingJob): Promise<void> {
    const { entry, retries } = job;

    try {
      console.log(`🔄 [Background] Processing journal entry ${entry.id} for user ${entry.userUid}... (Attempt ${retries + 1}/${this.MAX_RETRIES})`);

      // Prepare request body with the journal entry content as qna_pairs
      const requestBody: BothCrewsApiRequestBody = {
        qna_pairs: entry.content,
      };

      // Make POST request to both-crews API with 10-minute timeout
      const response = await fetch(this.bothCrewsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const responseData: BothCrewsApiResponse = await response.json();

      // Save the solution to the database
      const solution = await awsRdsSolutionRepository.createSolution({
        userUid: entry.userUid,
        entryDate: this.formatDateToISO(entry.entryDate),
        journalEntryId: entry.id,
        solution: responseData,
      });

      // Mark the journal entry as processed and unqueued
      await awsRdsJournalRepository.markEntryAsProcessed(entry.id);
      await awsRdsJournalRepository.markEntryAsUnqueued(entry.id);

      console.log(`✅ [Background] Successfully processed entry ${entry.id} and created solution ${solution.id}`);
    } catch (error) {
      console.error(`❌ [Background] Error processing entry ${entry.id}:`, error);

      // Retry logic
      if (retries < this.MAX_RETRIES - 1) {
        console.log(`🔄 [Background] Retrying entry ${entry.id}... (${retries + 1}/${this.MAX_RETRIES - 1})`);
        this.processingQueue.push({
          entry,
          retries: retries + 1,
        });
      } else {
        // Max retries reached - mark as unqueued so it can be tried again later
        console.error(`❌ [Background] Max retries reached for entry ${entry.id}. Marking as unqueued.`);
        await awsRdsJournalRepository.markEntryAsUnqueued(entry.id);
      }
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { queueSize: number; isProcessing: boolean } {
    return {
      queueSize: this.processingQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Set a custom API URL (useful for testing or different environments)
   */
  setApiUrl(url: string): void {
    this.bothCrewsApiUrl = url;
    console.log(`Both-crews API URL set to: ${url}`);
  }

  /**
   * Get the current API URL
   */
  getApiUrl(): string {
    return this.bothCrewsApiUrl;
  }

  /**
   * Format date to ISO string (YYYY-MM-DD) using local timezone
   */
  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Export singleton instance
export const bothCrewsService = BothCrewsService.getInstance();

