
import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyCookie } from "@/lib/auth";
import { lpLogin } from "./actions";

export const dynamic = "force-dynamic";

// ===== ボタン =====
function ModeButton(props: {
  title: string;
  href: string;
  sub?: string;
  variant?: "default" | "future";
}) {
  const isFuture = props.variant === "future";

  return (
    <a
      className="bigBtn glassStrong"
      href={props.href}
      style={{
        background: isFuture
          ? "rgba(255, 228, 230, 0.85)" // 未来だけ赤系
          : "rgba(255,255,255,0.82)",
        border: "1px solid rgba(255,255,255,0.75)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "0.5em",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#0b3aa6",
          }}
        >
          {props.title}
        </span>

        {props.sub && (
          <span
            style={{
              fontSize: 14,
              color: "#d9480f",
              fontWeight: 700,
              textShadow: "0 1px 2px rgba(255,255,255,0.6)",
            }}
          >
            {props.sub}
          </span>
        )}
      </div>
    </a>
  );
}

// ===== 認証 =====
async function isAuthed(): Promise<boolean> {
  const secret = process.env.LP_AUTH_SECRET ?? "";
  if (!secret) return false;

  const jar = await cookies();
  const signed = jar.get("kc_lp_auth")?.value;
  if (!signed) return false;

  const v = verifyCookie(signed, secret);
  return v.ok;
}

// ===== kch署名 =====
function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function signKch(secret: string, appId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { appId, iat: now, exp: now + 300 };
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `v1.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

function withKch(baseUrl: string, secret: string, appId: string) {
  if (!baseUrl || baseUrl === "#") return "#";
  try {
    const u = new URL(baseUrl);
    u.searchParams.set("kch", signKch(secret, appId));
    return u.toString();
  } catch {
    return baseUrl;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const gate = sp["gate"] ? true : false;

  const authed = await isAuthed();

  const bgUrl = process.env.LP_BG_URL ?? "/bg.jpeg";
  const logoUrl = process.env.LP_LOGO_URL ?? "/logo.png";

  const interviewPodUrl = process.env.NEXT_PUBLIC_INTERVIEW_POD_URL ?? "#";
  const esTrainerUrl = process.env.NEXT_PUBLIC_ES_TRAINER_URL ?? "#";

  // ★ここ修正済み（重要）
const futureTrainerUrl =
  "https://future-trainer.vercel.app";
  const essayTrainerUrl = process.env.NEXT_PUBLIC_ESSAY_TRAINER_URL ?? "#";

  const hubSecret = process.env.HUB_LINK_SECRET ?? "";

  const interviewPodHref = hubSecret
    ? withKch(interviewPodUrl, hubSecret, "interview-pod")
    : interviewPodUrl;

  const esTrainerHref = hubSecret
    ? withKch(esTrainerUrl, hubSecret, "es-trainer")
    : esTrainerUrl;

  const futureTrainerHref = futureTrainerUrl;
  const essayTrainerHref = essayTrainerUrl;

  const ADMIN_LINES = [
    "現在β版での運用を開始しています。",
    "ぜひともご使用経験を下記アンケートにご記入頂けると助かります。",
    "https://forms.gle/Ad4gDxW5Mh7cawby7",
  ];

  return (
    <div
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <main className="shell">
        {/* ロゴ */}
        <img
          src={logoUrl}
          alt="K-career"
          style={{
            width: "100%",
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(2,6,23,0.18)",
          }}
        />

        {/* タイトル */}
        <div className="titleWrap">
          <h1 className="h1">Job Readiness Trainer</h1>
          <div className="sub">比較ではなく、視点を切り替えて深く考える</div>
        </div>

        {/* 未認証 */}
        {!authed && (
          <section className="section">
            <div className="glass glassStrong">
              <form action={lpLogin} style={{ display: "flex", gap: 10 }}>
                <input className="input" name="password" placeholder="パスワード" />
                <button className="primaryBtn" type="submit">
                  入力
                </button>
              </form>
              {gate && <div className="err">パスワードが違います</div>}
            </div>
          </section>
        )}

        {/* 認証済み */}
        {authed && (
          <>
            <section className="section" style={{ gap: 10 }}>
              <ModeButton
                title="未来トレーナー"
                href={futureTrainerHref}
                sub="まずは自分の考えを整理"
                variant="future"
              />

              <ModeButton
                title="E.S.基礎トレーナー"
                href={esTrainerHref}
                sub="考えを言葉にする"
              />

{/*
<ModeButton
  title="小論文トレーナー"
  href={essayTrainerHref}
  sub="深く伝える力を鍛える"
/>
*/}

              <ModeButton
                title="面接基礎トレーナー"
                href={interviewPodHref}
                sub="実践で伝える"
              />
            </section>

            <div className="footer">
              このアプリは進路を考えるための教材です。
            </div>

            <div
              style={{
                marginTop: 10,
                background: "rgba(255, 245, 160, 0.75)",
                padding: 10,
                borderRadius: 18,
                textAlign: "center",
                fontWeight: 800,
                color: "#0b3aa6",
              }}
            >
              {ADMIN_LINES.map((t, i) => (
                <div key={i}>{t}</div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}