import http from "node:http";
import {URL} from "node:url";

const todoStore: Array<{ id: number; task: string }> = [];
let nextId = 1;
const MAX_ALLOWED_BYTES = 10 * 1024;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const method = req.method;

  if (parsedUrl.pathname === "/todos" && method === "GET") {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(todoStore));
    return;
  }

  const sendError = (status: number, message: string) => {
    res.writeHead(status, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: message}));
  }

  if (parsedUrl.pathname === "/todos" && method === "POST") {
    let body = "";
    let bytesRecieved = 0;

    req.on("data", (chunk) => {
      bytesRecieved += chunk.length;

      if (bytesRecieved > MAX_ALLOWED_BYTES) {
        req.destroy();
        console.warn("Alert: Heavy request severed mid-flight");
      } else {
        body += chunk.toString();
      }
    });

    req.on("end", () => {
      if (req.destroyed) return;

      try {
        const data = JSON.parse(body);

        if(!data.task || typeof data.task !== "string") {
          return sendError(400, "Invalid Payload Shape: task field missing or not a string.");
        }

        const newTodo = {id: nextId++, task: data.task};
        todoStore.push(newTodo);

        res.writeHead(201, {"Content-Type": "application/json"});

        res.end(JSON.stringify(newTodo));
      } catch (error) {
        sendError(400, "Malformed payload entity. Parsing aborted.");
      }
    });
    return;
  }

  sendError(404, "Route Entry Target Not Found");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server executing at http://localhost: ${PORT}`);
});
