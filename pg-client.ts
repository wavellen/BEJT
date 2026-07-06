import dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const { Pool } = pg;

interface Config {
  user: string;
  password: string;
  host: string;
  database: string;
  port: number;
  max: number;
  idleTimeoutMillis: number
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const dbConfiguration: Config = {
  user: requireEnv('PG_USER'),
  password: requireEnv('PG_PASSWORD'),
  host: requireEnv('PG_HOST'),
  database: requireEnv('PG_DATABASE'),
  port: parseInt(process.env.PG_PORT || '5432', 10),
  max: parseInt(process.env.PG_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLETIMEOUTMILLIS || '30000', 10)
}

export const dbPool = new Pool(dbConfiguration);

export async function runMigrationsAndSeed() {
  console.log("Running databse Migrations...");

  await dbPool.query(`
    Create TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uuid UUID DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);


  const checkCount = await dbPool.query('select count(*) from users');
  const count = parseInt(checkCount.rows[0].count, 10);

  if (count >= 100000) {
    console.log("Database already seeded with 100,000+ rows.");
    return;
  }

  console.log("Seeding 100,000 users. Hold tight, writing directly to disk....");

  await dbPool.query("BEGIN");
  try {
    for (let i = 0; i < 10; i++) {
      const values: string[] = [];
      for (let j = 0; j < 10000; j++) {
        const index = i * 10000 + j;
        values.push(`('user_${index}@chaos.com', 'Developer #${index}')`);
      }
      await dbPool.query(`insert into users (email, name) values ${values.join(',')};`);
    }
    await dbPool.query('COMMIT;');


    await dbPool.query('ANALYZE users;');
    console.log("Seeding completed cleanly!");
  } catch (error) {
    await dbPool.query("ROLLBACK;");
    console.error("Seeding Failed, transactions rolled back.", error);
    throw error;
  }
}
