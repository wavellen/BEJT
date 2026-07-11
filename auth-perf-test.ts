import argon2 from 'argon2';

async function profileArgon2() {
  const password = 'super_secure_password_123!';

  console.log("🛡️ Tuning Industry Standard Argon2id Hashing Profiles...\n");
  console.log("| RAM Cost | Passes (Time) | Threads | Execution Time (ms) | Throughput (Per Core/Sec) |");
  console.log("| -------- | ------------- | ------- | ------------------- | ------------------------- |");

  const profiles = [
    { name: "OWASP Minimum", memory: 19456, time: 2, parallelism: 1 },
    { name: "OWASP Recommended", memory: 65536, time: 3, parallelism: 4 },
    { name: "High Security", memory: 131072, time: 4, parallelism: 4 },
  ];

  for (const p of profiles) {
    const start = performance.now();

    await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: p.memory,
      timeCost: p.time,
      parallelism: p.parallelism
    });

    const duration = performance.now() - start;

    const throughput = Math.floor(1000 / duration);

    console.log(`| ${p.name} (${p.memory / 1024}MB) | ${p.time} | ${p.parallelism} | ${duration.toFixed(2)} ms | ~${throughput} req/sec |`);
  }
}

profileArgon2().catch(console.error);
