import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyCookie } from "@/lib/auth";
import { lpLogin } from "./actions";

export const dynamic = "force-dynamic";

// ===== ボタン（改良版）=====
function ModeButton(props: {
  title: string;
  href: string;
  sub?: string;
}) {
  return (
    <a className="bigBtn glassStrong bigBtnWhite" href={props.href}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "0.5em", // ★ 1文字分の余白
        }}
      >
        {/* タイトル */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#0b3aa6",
          }}
        >
          {props.title}
        </span>

        {/* 説明 */}
        {props.sub && (
          <span
            style={{
              fontSize: 12,
              color: "#d4a800", // ★ 濃い黄色
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {props.sub}
          </span>
        )}
      </div>
    </a>
  );
}

async function isAuthed(): Promise<boolean> {
  const secret = process.env.LP_AUTH_SECRET ?? "";
  if (!secret) return false;

  const jar = await cookies();
  const signed = jar.get("kc_lp_auth")?.value;
  if (!signed) return false;

  const v = verifyCookie(signed, secret);
  return v.ok;
}

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
  const ttlSeconds = 60 * 5;
  const payload = { appId, iat: now, exp: now + ttlSeconds };
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `v1.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  const sigB64 = b64url(sig);
  return `${data}.${sigB64}`;
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
  const futureTrainerUrl = process.env.NEXT_PUBLIC_FUTURE_TRAINER_URL ?? "#";
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
      className="bg"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <main className="shell">
        {/* ロゴ */}
        <div style={{ marginTop: 6 }}>
          <img
            src={logoUrl}
            alt="K-career"
            style={{
              width: "100%",
              borderRadius: 18,
              boxShadow: "0 10px 30px rgba(2,6,23,0.18)",
            }}
          />
        </div>

        {/* タイトル */}
        <div className="titleWrap">
          <h1 className="h1">Job Readiness Trainer</h1>
          <div className="sub">比較ではなく、視点を切り替えて深く考える</div>
        </div>

        {!authed && (
          <section className="section">
            <div className="glass glassStrong">
              <div className="accessTitle">アクセス</div>

              <form action={lpLogin} style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <input className="input" name="password" placeholder="パスワード" />
                <button className="primaryBtn" type="submit">
                  入力
                </button>
              </form>

              {gate && <div className="err">パスワードが違います</div>}
            </div>
          </section>
        )}

        {authed && (
          <>
            {/* ===== ボタン ===== */}
            <section className="section" style={{ gap: 10 }}>
              <ModeButton
                title="未来トレーナー"
                href={futureTrainerHref}
                sub="まずは自分の考えを整理"
              />

              <ModeButton
                title="E.S.基礎トレーナー"
                href={esTrainerHref}
                sub="考えを言葉にする"
              />

              <ModeButton
                title="小論文トレーナー"
                href={essayTrainerHref}
                sub="深く伝える力を鍛える"
              />

              <ModeButton
                title="面接基礎トレーナー"
                href={interviewPodHref}
                sub="実践で伝える"
              />
            </section>

            {/* 説明 */}
            <div className="footer">
              このアプリは、進路を考えるためのものです。<br />
              医療施設を含め、企業も視野に幅広く業界を理解し、考え方を獲得するための教材です。
            </div>

            {/* 管理者コメント */}
            <div
              className="glass"
              style={{
                marginTop: 10,
                background: "rgba(255, 245, 160, 0.75)",
                color: "#0b3aa6",
                padding: 10,
                borderRadius: 18,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 1.5,
                fontWeight: 800,
              }}
            >
              {ADMIN_LINES.map((t, i) => (
                <div key={i}>{t}</div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ===== 微調整CSS ===== */}
      <style>{`
        .bigBtn {
          padding: 10px 0 !important;
          border-radius: 16px !important;
        }

        .section {
          gap: 10px !important;
        }

        .footer {
          font-size: 12px !important;
          line-height: 1.5 !important;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}