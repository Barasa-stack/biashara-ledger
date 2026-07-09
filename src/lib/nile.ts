import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let _poolPromise: Promise<Pool> | null = null;
let _pool: Pool | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;

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

    _pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await _pool.connect();
      client.release();
    } catch (err) {
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
