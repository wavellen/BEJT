import http from 'node:http';

const IDEMPOTENCY_KEY = "tx_unique_signature_uuid_12345";
const payload = JSON.stringify({ userId: "user_alpha", amount: 250 });

function fireRequest(id: number) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': IDEMPOTENCY_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[Request #${id}] HTTP Status: ${res.statusCode} | Response:`, data);
        resolve(res.statusCode);
      });
    });

    req.on("error", (err) => {
      console.log(`🚨 [Request #${id}] Network Error Caught: ${err.message}`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function runChaos() {
  console.log("💥 Triggering concurrent flood of requests using identical idempotency tokens...");
  // Launching 5 concurrent requests simultaneously
  await Promise.all([
    fireRequest(1),
    fireRequest(2),
    fireRequest(3),
    fireRequest(4),
    fireRequest(5)
  ]);
}

runChaos();
