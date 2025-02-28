import { jwtVerify } from "jose";
import * as dotenv from "dotenv";
import { User } from "./types";

dotenv.config();

const NEXTAUTH_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret"
);

export async function verifyToken(token: string): Promise<User> {
  try {
    const { payload } = await jwtVerify(token, NEXTAUTH_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string | undefined,
    };
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
