import WebSocket from "ws";
import { URL } from "url";
import * as dotenv from "dotenv";
import { verifyToken } from "./auth";
import { User, ChatMessage, ClientWebSocket, IncomingMessage } from "./types";

dotenv.config();

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map<ClientWebSocket, User>();

wss.on("connection", async (ws: ClientWebSocket, req) => {
  const url = new URL(req.url || "", "http://localhost");
  const token = url.searchParams.get("token");

  let user: User;
  try {
    if (!token) throw new Error("No token provided");
    user = await verifyToken(token);
  } catch (err) {
    const errorMessage: ChatMessage = {
      type: "error",
      message: (err as Error).message,
    };
    ws.send(JSON.stringify(errorMessage));
    ws.close(1008, "Authentication failed");
    return;
  }

  ws.user = user;
  clients.set(ws, user);
  console.log(`${user.name} (ID: ${user.id}) connected`);

  const welcomeMessage: ChatMessage = {
    type: "connected",
    message: `Welcome, ${user.name}!`,
  };
  ws.send(JSON.stringify(welcomeMessage));

  ws.on("message", (message: WebSocket.RawData) => {
    let data: IncomingMessage;
    try {
      data = JSON.parse(message.toString()) as IncomingMessage;
    } catch (err) {
      const errorMessage: ChatMessage = {
        type: "error",
        message: "Invalid message format",
      };
      ws.send(JSON.stringify(errorMessage));
      return;
    }

    const broadcastMessage: ChatMessage = {
      type: "message",
      username: user.name,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    wss.clients.forEach((client: ClientWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(broadcastMessage));
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`${user.name} disconnected`);
    const leaveMessage: ChatMessage = {
      type: "info",
      message: `${user.name} has left the chat`,
    };
    wss.clients.forEach((client: ClientWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(leaveMessage));
      }
    });
  });

  ws.on("error", (error) => console.error("WebSocket error:", error));
});

console.log(`WebSocket server running on port ${PORT}`);
