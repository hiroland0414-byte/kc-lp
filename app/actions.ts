"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { makeLpAuthPayload, sha256Hex, signCookie } from "@/lib/auth";

const COOKIE_NAME = "kc_lp_auth";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * LPログイン処理
 * - パスワード一致 → Cookie発行 → /
 * - 不一致 → /?gate=1 に戻す
 */
export async function lpLogin(formData: FormData): Promise<void> {
  const pass = String(formData.get("password") ?? "").trim();

  const expected = process.env.LP_ACCESS_PASSWORD ?? "";
  const secret = process.env.LP_AUTH_SECRET ?? "";

  // 必須環境変数チェック
  if (!expected || !secret || secret.length < 16) {
    redirect("/?gate=1");
  }

  // パスワード不一致
  if (!pass || sha256Hex(pass) !== sha256Hex(expected)) {
    redirect("/?gate=1");
  }

  // 署名付きCookie生成
  const signed = signCookie(makeLpAuthPayload(), secret);

  const jar = await cookies();
  jar.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  // 成功時はトップへ
  redirect("/");
}