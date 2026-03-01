import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyCookie } from "@/lib/auth";
import { lpLogin } from "./actions";

export const dynamic = "force-dynamic";

function ModeButton(props: { title: string; href: string }) {
  return (
    <a className="bigBtn glassStrong" href={props.href}>
      <span className="bigBtnText">{props.title}</span>
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

  const interviewPodUrl =
    process.env.NEXT_PUBLIC_INTERVIEW_POD_URL ?? "#";
  const esTrainerUrl =
    process.env.NEXT_PUBLIC_ES_TRAINER_URL ?? "#";

  const hubSecret = process.env.HUB_LINK_SECRET ?? "";

  const interviewPodHref = hubSecret
    ? withKch(interviewPodUrl, hubSecret, "interview-pod")
    : interviewPodUrl;

  const esTrainerHref = hubSecret
    ? withKch(esTrainerUrl, hubSecret, "es-trainer")
    : esTrainerUrl;

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
          <div className="sub">
            比較ではなく、視点を切り替えて深く考える
          </div>
        </div>

        {/* 未認証 */}
        {!authed && (
          <section className="section">
            <div className="glass glassStrong">
              <div className="accessTitle">アクセス</div>

              <div className="subDark">
                配布されたパスワードを入力してください（60日保持）。
              </div>

              <form
                action={lpLogin}
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <input
                  className="input"
                  name="password"
                  inputMode="text"
                  placeholder="英数字パスワード"
                  autoComplete="one-time-code"
                  style={{ flex: 3 }}
                />

                <button
                  className="primaryBtn"
                  type="submit"
                  style={{ flex: 1.5 }}
                >
                  入　力
                </button>
              </form>

              {gate && (
                <div className="err">
                  パスワードが違います。もう一度入力してください。
                </div>
              )}
            </div>
          </section>
        )}

        {/* 認証済み */}
        {authed && (
          <>
            <section className="section">
              <ModeButton
                title="面接基礎トレーナー"
                href={interviewPodHref}
              />
              <ModeButton
                title="E.S.基礎トレーナー"
                href={esTrainerHref}
              />
            </section>

            <div className="footer">
              このアプリは、進路を考えるためのものです。<br />
              医療施設を含め、企業も視野に幅広く業界を理解し、
              考え方を獲得するための教材です。<br />
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