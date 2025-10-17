import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SALT = Buffer.from(process.env.HASH_SALT!, "utf8");
const KEY  = Buffer.from(process.env.ENCRYPTION_KEY!, "utf8"); // 32 chars recommended

export function hashNIN(nin: string) {
  const h = createHmac("sha256", Buffer.concat([KEY, SALT]));
  h.update(nin.trim());
  return h.digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const A = Buffer.from(a, "hex");
  const B = Buffer.from(b, "hex");
  return A.length === B.length && timingSafeEqual(A, B);
}

export function nonce(len = 16) {
  return randomBytes(len).toString("hex");
}
