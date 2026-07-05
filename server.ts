import http from 'node:http';
import { URL } from 'node:url';
import { orderTable, generateNextOrderId, idempotencyCache, seedDatabase, Order } from './db';

seedDatabase();

const MAX_ALLOWED_BYTES = 10 * 1024;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
  const method = req.method;

  const sendResponse = (status: number, data: any) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // ROUTE: GET /v1/orders (Cursor Pagination Architecture)
  if (parsedUrl.pathname === '/v1/orders' && method === 'GET') {
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '10', 10);
    // base64 encoded sequence id
    const cursorStr = parsedUrl.searchParams.get('cursor');

    let cursorId = 0;
    if (cursorStr) {
      cursorId = parseInt(Buffer.from(cursorStr, 'base64').toString('ascii'), 10);
    }

    // under the hood WHERE id > cursor LIMIT limit
    const filteredOrders = orderTable.filter(order => order.id > cursorId);
    const paginatedResults = filteredOrders.slice(0, limit);

    let nextCursor: string | null = null;
    if (paginatedResults.length > 0) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      const hasMore = orderTable.some(order => order.id > lastItem.id);
      if (hasMore) {
        nextCursor = Buffer.from(lastItem.id.toString()).toString('base64');
      }
    }

    return sendResponse(200, {
      data: paginatedResults,
      pagination: {
        limit,
        next_cursor: nextCursor
      }
    });
  }

  // ROUTE: POST /v1/orders (Idempotency Protected)
  if (parsedUrl.pathname === '/v1/orders' && method === 'POST') {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return sendResponse(400, { error: "Missing required 'Idempotency-Key' header entry." });
    }

    const cacheHit = idempotencyCache.get(idempotencyKey);
    if (cacheHit) {
      if (cacheHit.status === 'STARTED') {
        return sendResponse(409, { error: "Concurrent operation in progress. Please retry shortly." });
      }
      return sendResponse(200, cacheHit.response);
    }

    // Lock the operation atomic state
    idempotencyCache.set(idempotencyKey, { status: 'STARTED' });

    let body = '';
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_ALLOWED_BYTES) req.destroy();
      else body += chunk.toString();
    });

    req.on('end', () => {
      if (req.destroyed) return;

      try {
        const payload = JSON.parse(body);

        setTimeout(() => {
          const newOrder: Order = {
            // @ts-ignore
            id: generateNextOrderId(),
            userId: payload.userId || 'guest_user',
            amount: payload.amount || 100,
            createdAt: new Date()
          };

          orderTable.push(newOrder);

          const successPayload = { message: "Order processed successfully", order: newOrder };

          // Persist transaction execution results in state cache
          idempotencyCache.set(idempotencyKey, { status: 'COMPLETED', response: successPayload });

          return sendResponse(201, successPayload);
        }, 1500);

      } catch (err) {
        idempotencyCache.delete(idempotencyKey); // Evict lock on runtime parse failures
        return sendResponse(400, { error: 'Invalid body schema entity.' });
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint target not found.' }));
});

server.listen(3000, () => console.log('🛡️ Enterprise Core 1.1 operational on port 3000'));
