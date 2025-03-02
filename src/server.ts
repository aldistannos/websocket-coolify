import WebSocket from "ws";

const PORT = parseInt(process.env.WS_PORT || "3282", 10);
const wss = new WebSocket.Server({ port: PORT });

// Track subscriptions for each conversation
const subscriptions = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  console.log("New client connected");

  // Handle incoming messages
  ws.on("message", (message: WebSocket.RawData) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received from client:", data);

      // Handle subscription requests
      if (data.type === "subscribe" && data.conversationId) {
        const convId = data.conversationId;
        if (!subscriptions.has(convId)) {
          subscriptions.set(convId, new Set());
        }
        subscriptions.get(convId)?.add(ws);
        console.log(`Client subscribed to conversation ${convId}`);
      }

      // Handle new messages
      if (data.type === "new_message") {
        const convId = data.conversationId;
        const subs = subscriptions.get(convId) || new Set();
        subs.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
    // Remove client from all subscriptions
    subscriptions.forEach((clients, convId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        subscriptions.delete(convId);
      }
    });
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
