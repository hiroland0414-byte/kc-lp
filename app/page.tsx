import { cookies } from "next/headers";
import { verifyCookie } from "@/lib/auth";
import { lpLogin } from "./actions";

export const dynamic = "force-dynamic";

function ModeButton(props: { title: string; href: string }) {
  return (
    <a className="bigBtn" href={props.href}>
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

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const gate = sp["gate"] ? true : false;

  const authed = await isAuthed();

  // 管理者が決める（無料運用：環境変数 or public差し替え）
  const bgUrl = process.env.LP_BG_URL ?? "/bg.jpeg";
  const logoUrl = process.env.LP_LOGO_URL ?? "/logo.png";

  // 対応プロジェクトは固定
  const interviewPodUrl = process.env.NEXT_PUBLIC_INTERVIEW_POD_URL ?? "#";
  const esTrainerUrl = process.env.NEXT_PUBLIC_ES_TRAINER_URL ?? "#";

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
          <h1 className="h1">統合トレーニング入口</h1>
          <div className="sub">比較ではなく、視点を切り替えて深く考える</div>
        </div>

        {/* 未認証：パスワード入力画面だけ */}
        {!authed && (
          <section className="section">
            <div className="glass glassStrong">
              <div
                style={{
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.92)",
                  textShadow: "0 6px 18px rgba(2,6,23,0.45)",
                }}
              >
                アクセス
              </div>
              <div className="sub" style={{ marginTop: 6 }}>
                配布されたパスワードを入力してください（30日保持／強制ログアウトなし）。
              </div>

              <form action={lpLogin} style={{ marginTop: 12 }}>
                <input
                  className="input"
                  name="password"
                  inputMode="text"
                  placeholder="英数字パスワード"
                  autoComplete="one-time-code"
                />
                <button className="primaryBtn" type="submit">
                  入る
                </button>
                {gate && <div className="err">パスワードが違います。もう一度入力してください。</div>}
              </form>

              <div className="adminLink">
                管理者：<a href="/admin">/admin</a>
              </div>
            </div>
          </section>
        )}

        {/* 認証済み：モード選択画面 */}
        {authed && (
          <>
            <section className="section">
              <ModeButton title="interview-pod（面接トレーニング）" href={interviewPodUrl} />
              <ModeButton title="es-trainer（ES添削）" href={esTrainerUrl} />
            </section>

            <div className="footer">
              このアプリは、進路を考えるためのものです。<br />
              医療施設を含め、企業も視野に幅広く業界を理解し、考え方を獲得するための教材です。<br />
              <span style={{ opacity: 0.9 }}>
                運用：サーバーレス／無料。強制ログアウトなし（Cookie最大30日）。
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}