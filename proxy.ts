import { NextRequest, NextResponse } from "next/server";
import { verifyCookie } from "@/lib/auth";

const COOKIE_NAME = "kc_lp_auth";

// 画像・静的ファイルを素通しするための判定
function isPublicAssetPath(pathname: string) {
  // Next内部
  if (pathname.startsWith("/_next")) return true;

  // favicon 等
  if (pathname === "/favicon.ico") return true;

  // public配信される “拡張子あり” ファイルは素通し
  // （bg.jpeg / logo.png もここで通る）
  const hasFileExt = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (hasFileExt) return true;

  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 入口（ログイン画面）は通す
  if (pathname === "/") return NextResponse.next();

  // ✅ admin は通す（読み取り専用の前提）
  if (pathname.startsWith("/admin")) return NextResponse.next();

  // ✅ 画像など静的ファイルは通す（ここが今回の核心）
  if (isPublicAssetPath(pathname)) return NextResponse.next();

  // ---- ここから先をゲート対象にする ----
  const secret = process.env.LP_AUTH_SECRET ?? "";
  if (!secret) return new NextResponse("LP_AUTH_SECRET is missing.", { status: 500 });

  const signed = req.cookies.get(COOKIE_NAME)?.value;
  if (!signed) return NextResponse.redirect(new URL("/?gate=1", req.url));

  const v = verifyCookie(signed, secret);
  if (!v.ok) return NextResponse.redirect(new URL("/?gate=1", req.url));

  return NextResponse.next();
}

// 全パス対象でOK（素通しは proxy 内で制御）
export const config = {
  matcher: ["/:path*"],
};