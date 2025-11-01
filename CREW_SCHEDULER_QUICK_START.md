# Crew Scheduler Quick Start

Get the crew scheduler up and running in 5 minutes!

## Step 1: Install Dependencies (Already Done ✅)

The `node-cron` package has already been installed.

## Step 2: Configure Environment Variables

Update your `.env.local` file (or `.env`) with the scheduler configuration:

> **Note:** Next.js uses `.env.local` by default for local development. All migration scripts have been updated to load from `.env.local` first, then fall back to `.env`.

```env
# Crew Scheduler Configuration
CREW_API_URL=http://13.53.53.18:8000/run-crew
CREW_SCHEDULER_INTERVAL_MINUTES=60
```

## Step 3: Run Database Migrations

Create and configure the `crew_responses` table:

```bash
# Create the table
npm run db:migrate:crew-responses

# Add unique constraint (one entry per user per day)
npm run db:migrate:crew-responses-update
```

> **Important:** The second migration ensures **one entry per user per day**. When the scheduler runs multiple times, it updates the existing entry instead of creating duplicates.

## Step 4: Start the Scheduler

You have two options:

### Option A: Via API (Recommended)

Start your Next.js server:

```bash
npm run dev
```

Then start the scheduler via API:

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalMinutes": 30}'
```

### Option B: Auto-start with Server

If you want the scheduler to automatically start when your server starts, add this to your server initialization code (e.g., in a custom server file or middleware).

However, for Next.js, **Option A is recommended** to maintain better control.

## Step 5: Test the Scheduler

Run the scheduler immediately to test:

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run-now"}'
```

Check the console logs to see the execution results.

## Step 6: View Results

Get crew responses for a specific user:

```bash
curl "http://localhost:3000/api/crew-responses?userUid=YOUR_USER_UID&limit=10"
```

Or view all recent responses:

```bash
curl "http://localhost:3000/api/crew-responses?limit=20"
```

## Step 7: Monitor and Control

### Check Status

```bash
curl http://localhost:3000/api/scheduler
```

### Stop the Scheduler

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## What Happens During Execution?

1. The scheduler fetches all users from the database
2. For each user with `context` or `goal` data:
   - Sends a POST request to the crew API with:
     ```json
     {
       "customer_business_background_latest": "user's context",
       "customer_goal_latest": "user's goal"
     }
     ```
3. Stores the API response in the `crew_responses` table
4. Logs success/failure for each user

## Troubleshooting

### Scheduler won't start?

1. Check environment variables are set
2. Verify database connection: `npm run db:test`
3. Check if migration ran successfully

### No responses being saved?

1. Verify users have `context` and `goal` data in the database
2. Check if the crew API is accessible:
   ```bash
   curl -X POST http://13.53.53.18:8000/run-crew \
     -H "Content-Type: application/json" \
     -d '{"customer_business_background_latest": "test", "customer_goal_latest": "test"}'
   ```
3. Check application logs for errors

### How to verify users have data?

Query your database:
```sql
SELECT uid, email, context, goal FROM users WHERE context IS NOT NULL OR goal IS NOT NULL;
```

## Production Deployment

For production, consider:

1. **Environment Variables**: Set proper values for:
   - `CREW_API_URL`
   - `CREW_SCHEDULER_INTERVAL_MINUTES`

2. **Security**: Add authentication to the `/api/scheduler` endpoints

3. **Monitoring**: 
   - Set up logging aggregation
   - Monitor the `crew_responses` table growth
   - Alert on scheduler failures

4. **Scaling**: 
   - Consider implementing job queues for large user bases
   - Add rate limiting for the external API

5. **Persistence**: The scheduler needs to be restarted if your server restarts. Consider:
   - Using a process manager (PM2)
   - Implementing an auto-start mechanism
   - Or manually restarting via API after deployment

## Next Steps

- Read the full guide: `CREW_SCHEDULER_GUIDE.md`
- Review the service code: `src/services/scheduler/`
- Customize the scheduler behavior as needed
- Set up monitoring and alerting

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all migrations have been run
3. Test the crew API endpoint manually
4. Review user data in the database

Happy scheduling! 🚀

