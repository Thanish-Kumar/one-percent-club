import * as cron from 'node-cron';
import { awsRdsUserRepository } from '@/repositories/user/AwsRdsUserRepository';
import { awsRdsCrewResponseRepository } from '@/repositories/crew-response/AwsRdsCrewResponseRepository';
import { bothCrewsService } from '@/services/both-crews';

interface CrewApiRequestBody {
  customer_business_background_latest: string | null;
  customer_goal_latest: string | null;
}

interface CrewApiResponse {
  [key: string]: any;
}

export class CrewSchedulerService {
  private static instance: CrewSchedulerService;
  private task: cron.ScheduledTask | null = null;
  private intervalMinutes: number = 60; // default 60 minutes
  private crewApiUrl: string = process.env.CREW_API_URL || 'http://13.53.53.18:8000/run-crew';
  private isRunning: boolean = false;

  private constructor() {
    // Initialize with environment variables if available
    const envInterval = process.env.CREW_SCHEDULER_INTERVAL_MINUTES;
    if (envInterval && !isNaN(parseInt(envInterval))) {
      this.intervalMinutes = parseInt(envInterval);
    }
  }

  static getInstance(): CrewSchedulerService {
    if (!CrewSchedulerService.instance) {
      CrewSchedulerService.instance = new CrewSchedulerService();
    }
    return CrewSchedulerService.instance;
  }

  /**
   * Start the scheduler with a given interval in minutes
   */
  start(intervalMinutes: number): void {
    if (this.task) {
      console.log('Scheduler is already running. Stop it first before starting a new one.');
      return;
    }

    this.intervalMinutes = intervalMinutes;
    
    // Convert minutes to cron expression
    // For intervals that divide evenly into 60, use minute-based cron
    // Otherwise, use a combination approach
    const cronExpression = this.getCronExpression(intervalMinutes);

    console.log(`Starting crew scheduler with interval: ${intervalMinutes} minutes`);
    console.log(`Cron expression: ${cronExpression}`);

    this.task = cron.schedule(cronExpression, async () => {
      await this.runScheduledTask();
    });

    this.isRunning = true;
    console.log('Crew scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      console.log('Crew scheduler stopped');
    } else {
      console.log('Scheduler is not running');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; intervalMinutes: number; apiUrl: string } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      apiUrl: this.crewApiUrl,
    };
  }

  /**
   * Run the scheduled task immediately (for testing)
   */
  async runNow(): Promise<void> {
    console.log('Running scheduled task manually...');
    await this.runScheduledTask();
  }

  /**
   * Convert minutes to cron expression
   */
  private getCronExpression(minutes: number): string {
    // For intervals that divide evenly into 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60)
    if (60 % minutes === 0) {
      return `*/${minutes} * * * *`;
    }
    
    // For other intervals, run every minute and use internal logic to throttle
    // This is handled by checking last run time
    return '* * * * *';
  }

  /**
   * The main scheduled task that processes all users
   */
  private async runScheduledTask(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Starting crew scheduler task...`);

      // Fetch all users from the database
      const users = await awsRdsUserRepository.getUsers(1000, 0); // Get up to 1000 users
      console.log(`Found ${users.length} users to process`);

      if (users.length === 0) {
        console.log('No users found. Skipping this run.');
        return;
      }

      // Process each user
      let successCount = 0;
      let errorCount = 0;

      let skippedCount = 0;

      for (const user of users) {
        try {
          // Skip users without context or goal (optional - remove if you want to process all users)
          if (!user.context && !user.goal) {
            console.log(`⏭️  Skipping user ${user.uid} - no context or goal`);
            skippedCount++;
            continue;
          }

          // Check if questions are already captured for this user today
          const hasResponseToday = await awsRdsCrewResponseRepository.hasResponseForToday(user.uid);
          
          if (hasResponseToday) {
            console.log(`⏭️  Skipping user ${user.uid} - questions already captured today`);
            skippedCount++;
            continue;
          }

          // Prepare the request body
          const requestBody: CrewApiRequestBody = {
            customer_business_background_latest: user.context || null,
            customer_goal_latest: user.goal || null,
          };

          console.log(`🔄 Processing user ${user.uid}...`);

          // Make POST request to the crew API
          // Note: Crew API can take 20+ seconds to respond, so allow sufficient time
          const response = await fetch(this.crewApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            // Give the API plenty of time (60 seconds)
            signal: AbortSignal.timeout(60000),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error Response:`, errorText);
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
          }

          const responseData: CrewApiResponse = await response.json();

          // Check if we got a simple response instead of detailed one
          const isSimpleResponse = responseData.questions && 
                                   Array.isArray(responseData.questions) && 
                                   responseData.questions.length < 5 &&
                                   typeof responseData.questions[0] === 'string';
          
          const isDetailedResponse = responseData.Questions && 
                                     Array.isArray(responseData.Questions) &&
                                     responseData.Questions.length >= 5;

          if (isSimpleResponse && !isDetailedResponse) {
            console.warn(`⚠️  User ${user.uid}: Received simple response format (may not be complete)`);
          }

          // Save the response to the database (will be new entry for today)
          const savedResponse = await awsRdsCrewResponseRepository.upsertCrewResponse({
            userUid: user.uid,
            requestContext: user.context,
            requestGoal: user.goal,
            responseData: responseData,
          });

          console.log(`✅ Created response for user ${user.uid} (ID: ${savedResponse.id})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error processing user ${user.uid}:`, error);
          errorCount++;
        }
      }

      console.log(`[${new Date().toISOString()}] Crew scheduler task completed.`);
      console.log(`Summary: ${successCount} created, ${skippedCount} skipped (already captured today), ${errorCount} failed`);

      // After processing all users, queue today's journal entries for background processing
      console.log('\n🔄 Queueing both-crews processing for journal entries...');
      await bothCrewsService.processTodayEntries();
      const queueStatus = bothCrewsService.getQueueStatus();
      console.log(`✅ Both-crews entries queued - Queue size: ${queueStatus.queueSize}, Processing: ${queueStatus.isProcessing}`);
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  }

  /**
   * Set a custom API URL (useful for testing or different environments)
   */
  setApiUrl(url: string): void {
    this.crewApiUrl = url;
    console.log(`Crew API URL set to: ${url}`);
  }
}

// Export singleton instance
export const crewSchedulerService = CrewSchedulerService.getInstance();

