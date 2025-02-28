import { WebSocket } from "ws";

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface ChatMessage {
  type: "message" | "info" | "error" | "connected";
  username?: string;
  message: string;
  timestamp?: string;
}

export interface ClientWebSocket extends WebSocket {
  user?: User;
}

export interface IncomingMessage {
  message: string;
}
