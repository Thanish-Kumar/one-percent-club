import { Pool, PoolClient } from 'pg';

// Database connection pool for AWS RDS PostgreSQL
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Get database connection pool
  getPool(): Pool {
    if (!this.pool) {
      const password = process.env.DB_PASSWORD;
      
      // Validate required environment variables
      if (!password) {
        console.error('⚠️  Database configuration error:');
        console.error('   DB_PASSWORD is not set in .env.local');
        console.error('   Please check your .env.local file');
        throw new Error('DB_PASSWORD environment variable is required');
      }

      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'oneprocentclub',
        user: process.env.DB_USER || 'postgres',
        password: password,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
      });
    }
    return this.pool;
  }

  // Get a client from the pool for transactions
  async getClient(): Promise<PoolClient> {
    const pool = this.getPool();
    return pool.connect();
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Close all connections
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();

// Export convenience function to get pool (lazy evaluation)
export const getDatabasePool = (): Pool => {
  return database.getPool();
};

