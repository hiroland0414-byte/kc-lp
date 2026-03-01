import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyCookie } from "@/lib/auth";
import { lpLogin } from "./actions";

export const dynamic = "force-dynamic";

function ModeButton(props: { title: string; href: string; badge?: string }) {
  return (
<a className="bigBtn glass glassStrong" href={props.href}>
  <span className="bigBtnText">{props.title}</span>
</a>
  );
}

async function isAuthed(): Promise<boolean> {
  const secret = process.env.LP_AUTH_SECRET ?? "";
  if (!secret) return false;

  const jar = await cookies(); // ✅ Next.jsのcookies()はawaitが必要な環境がある
  const signed = jar.get("kc_lp_auth")?.value;
  if (!signed) return false;

  const v = verifyCookie(signed, secret);
  return v.ok;
}

/**
 * kch token generator (v1)
 * - payload: { appId, iat, exp }
 * - token: v1.<payloadB64>.<sigB64>
 *
 * NOTE: This token is for "LP -> app gate" only.
 */
function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function signKch(secret: string, appId: string) {
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = 60 * 5; // 5分で失効（短命でOK：LP経由の一瞬だけ使う）
  const payload = { appId, iat: now, exp: now + ttlSeconds };
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `v1.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  const sigB64 = b64url(sig);
  return `${data}.${sigB64}`;
}

function withKch(baseUrl: string, secret: string, appId: string) {
  // baseUrl が未設定のときは安全に #
  if (!baseUrl || baseUrl === "#") return "#";
  try {
    const u = new URL(baseUrl);
    u.searchParams.set("kch", signKch(secret, appId));
    return u.toString();
  } catch {
    // 相対URLなどが来た場合はそのまま返す（運用上は https://... を推奨）
    return baseUrl;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  // gate=1 は「パスワード誤り」表示のため
  const gate = sp["gate"] ? true : false;

  // from=interview-pod / from=es-trainer が付いてLPへ戻ってきた時の並び替えに使う
  const fromRaw = sp["from"];
  const from = Array.isArray(fromRaw) ? fromRaw[0] : fromRaw;

  const authed = await isAuthed();

  // 管理者が決める（無料運用：環境変数 or public差し替え）
  const bgUrl = process.env.LP_BG_URL ?? "/bg.jpeg";
  const logoUrl = process.env.LP_LOGO_URL ?? "/logo.png";

  // 対応プロジェクトURL（LPからのみ配布）
  const interviewPodUrl = process.env.NEXT_PUBLIC_INTERVIEW_POD_URL ?? "#";
  const esTrainerUrl = process.env.NEXT_PUBLIC_ES_TRAINER_URL ?? "#";

  // LP -> app gate 用の共通シークレット
  const hubSecret = process.env.HUB_LINK_SECRET ?? "";

  // kch を付けた遷移先（hubSecretが無い場合は素URL）
  const interviewPodHref =
    hubSecret ? withKch(interviewPodUrl, hubSecret, "interview-pod") : interviewPodUrl;
  const esTrainerHref =
    hubSecret ? withKch(esTrainerUrl, hubSecret, "es-trainer") : esTrainerUrl;

  // 「from」が付いて戻ってきたら、そのボタンを先頭に出す（迷子防止）
  const buttons = [
    {
      id: "interview-pod",
      title: "面接基礎トレーナー",
      href: interviewPodHref,
    },
    {
      id: "es-trainer",
      title: "E.S.基礎トレーナー",
      href: esTrainerHref,
    },
  ].sort((a, b) => {
    if (!from) return 0;
    if (a.id === from) return -1;
    if (b.id === from) return 1;
    return 0;
  });

  return (
    <div
      className="bg"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <main className="shell">
        {/* ロゴ：枠なし・横いっぱい */}
        <div style={{ marginTop: 6 }}>
          <img
            src={logoUrl}
            alt="K-career"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: 18,
              boxShadow: "0 10px 30px rgba(2,6,23,0.18)",
            }}
          />
        </div>

        {/* タイトル */}
        <div className="titleWrap">
          <h1 className="h1">就活支援基礎トレーナー</h1>
          <div className="sub">比較ではなく、視点を切り替えて深く考える</div>
        </div>

        {/* 未認証：パスワード入力画面だけ */}
        {!authed && (
          <section className="section">
            <div className="glass glassStrong">
              <div
  style={{
    fontWeight: 900,
    color: "#0b2a55",
    textShadow: "0 2px 10px rgba(255,255,255,0.35)",
  }}
>
  アクセス
</div>
              <div className="sub" style={{ marginTop: 6 }}>
                配布されたパスワードを入力してください（60日保持）。
              </div>

<form
  action={lpLogin}
  style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}
>
  <input
    className="input"
    name="password"
    inputMode="text"
    placeholder="英数字パスワード"
    autoComplete="one-time-code"
    style={{ flex: 3 }}   // ← 3/4 相当
  />
  <button className="primaryBtn" type="submit" style={{ flex: 1.5 }}>
    入　力
  </button>
  {gate && <div className="err">パスワードが違います。もう一度入力してください。</div>}
</form>

{gate && (
  <div className="err" style={{ marginTop: 10 }}>
    パスワードが違います。もう一度入力してください。
  </div>
)}

              <div className="adminLink">
                管理者：<a href="/admin">/admin</a>
              </div>
            </div>
          </section>
        )}

        {/* 認証済み：モード選択画面（fromがあれば並び替え） */}
        {authed && (
          <>
            <section className="section">
              {from && (
                <div style={{ marginBottom: 10, opacity: 0.92, fontSize: 13 }}>
                  入口に戻りました（推奨：{from}）
                </div>
              )}

              {buttons.map((b) => (
                <ModeButton
                  key={b.id}
                  title={b.title}
                  href={b.href}
                  badge={from === b.id ? "←ここから戻りました" : undefined}
                />
              ))}
            </section>

            <div className="footer">
              このアプリは、進路を考えるためのものです。<br />
              医療施設を含め、企業も視野に幅広く業界を理解し、考え方を獲得するための教材です。<br />
              <span style={{ opacity: 0.9 }}>
              （Cookie最大60日）。
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}