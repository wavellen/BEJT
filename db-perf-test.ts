import { dbPool, runMigrationsAndSeed } from "./pg-client";

async function runBenchmark() {
  await runMigrationsAndSeed();

  const targetEmail: string = "user_87432@chaos.com";

  console.log(`\n [Test 1] Querying unindexed column for: ${targetEmail}`);

  const unindexedPlan = await dbPool.query(`
    explain analyze select * from users where email = $1;
  `, [targetEmail]);

  unindexedPlan.rows.forEach(row => console.log(row["QUERY PLAN"]));

  console.log("\n--------------------------------------------------------------------------");
  console.log("[GUARDRAIL] Injecting B-tree Index onto users(email)");

  await dbPool.query(`create index if not exists idx_users_email on users(email);`);
  await dbPool.query(`analyze users;`);

  console.log(`[TEST 2] Querying indexed column for: ${targetEmail}`);

  const indexedPath = await dbPool.query(`
    explain analyze select * from users where email = $1
  `, [targetEmail]);

  indexedPath.rows.forEach(row => console.log(row["QUERY PLAN"]));

  await dbPool.end();
};

runBenchmark().catch(console.error);
