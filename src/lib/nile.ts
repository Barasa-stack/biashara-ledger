import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let _poolPromise: Promise<Pool> | null = null;
let _pool: Pool | null = null;

function getConnectionString(): string {
  // Use DATABASE_URL for local development
  const url = process.env.DATABASE_URL;
  if (url) {
    console.log('🔗 Using DATABASE_URL (local database)');
    return url;
  }

  // Fallback to Nile (production)
  const host = process.env.NILEDB_HOST || 'us-west-2.db.thenile.dev';
  const port = process.env.NILEDB_PORT || '5432';
  const database = process.env.NILEDB_DATABASE || 'Biasharaledger_App';
  const user = process.env.NILEDB_USER;
  const password = process.env.NILEDB_PASSWORD;

  if (!user || !password) {
    throw new Error('Database credentials not configured. Set DATABASE_URL or NILEDB_USER/NILEDB_PASSWORD.');
  }

  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

async function getNilePoolInternal(): Promise<Pool> {
  if (_pool) return _pool;
  if (_poolPromise) return _poolPromise;

  _poolPromise = (async () => {
    const connectionString = getConnectionString();
    console.log('📊 Connecting to database...');

    _pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    try {
      const client = await _pool.connect();
      console.log('✅ Database connected successfully!');
      client.release();
    } catch (err) {
      console.error('❌ Database connection failed:', err);
      throw err;
    }

    return _pool;
  })();

  return _poolPromise;
}

export async function getNileDb(): Promise<Pool> {
  return getNilePoolInternal();
}

export async function closeNilePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _poolPromise = null;
  }
}
