import crypto from "crypto";

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function signCookie(payload: string, secret: string): string {
  const h = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `${payload}.${h}`;
}

export function verifyCookie(signed: string, secret: string): { ok: boolean; payload?: string } {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return { ok: false };
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  const ok = timingSafeEqualHex(sig, expected);
  return ok ? { ok: true, payload } : { ok: false };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function makeLpAuthPayload(): string {
  // 30日Cookieの中身：バージョン + 発行時刻
  return `v1:${Date.now()}`;
}