import { dbClient } from '../backend/src/database/dbClient.js';

async function testDatabase() {
  console.log('--- DATABASE CONNECTION TEST ---');
  try {
    // Attempt a basic query to verify connection
    // This will fail if the DB is not running, which is expected in environments without Postgres.
    await dbClient.$queryRaw`SELECT 1 as result`;
    console.log('✅ Successfully connected to the database.');
  } catch (error: any) {
    console.error('❌ Database connection failed. Is PostgreSQL running?');
    console.error(error.message);
    process.exit(1);
  } finally {
    await dbClient.$disconnect();
  }
}

testDatabase();
