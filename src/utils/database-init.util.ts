import { Client } from 'pg';

export async function createDatabaseIfNotExists(): Promise<void> {
  const dbName = process.env.DB_NAME || 'wallet_db';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  const client = new Client({
    host,
    port,
    user: username,
    password,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    console.log(`Connecting to PostgreSQL to check database "${dbName}"...`);
    await client.connect();

    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (result.rows.length === 0) {
      console.log(` Database "${dbName}" not found. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(` Database "${dbName}" created successfully`);
    } else {
      console.log(` Database "${dbName}" already exists`);
    }
  } catch (error: any) {
    console.error('Error creating database:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.warn(' Continuing despite database creation error...');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}
