#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSolutionsMigrations() {
  try {
    console.log('🚀 Starting solutions migrations...');
    
    // 1. Add is_processed_for_solutions column to journal_entries
    console.log('\n📝 Adding is_processed_for_solutions column to journal_entries...');
    const addColumnSql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/migrations/add_processed_column_to_journal_entries.sql'),
      'utf8'
    );
    await pool.query(addColumnSql);
    console.log('✅ Column added successfully');
    
    // 2. Create solutions table
    console.log('\n📝 Creating solutions table...');
    const createTableSql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/migrations/create_solutions_table.sql'),
      'utf8'
    );
    await pool.query(createTableSql);
    console.log('✅ Solutions table created successfully');
    
    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runSolutionsMigrations();

