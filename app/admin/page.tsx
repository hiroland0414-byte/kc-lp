export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bgUrl = process.env.LP_BG_URL ?? "/bg.jpeg";
  const logoUrl = process.env.LP_LOGO_URL ?? "/logo.png";
  const hasPass = !!process.env.LP_ACCESS_PASSWORD;

  return (
    <main className="container">
      <header className="header">
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "radial-gradient(circle at 30% 30%, #8fe3b5, #3aa6b9)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)"
        }} />
        <div>
          <div className="h1">Admin (Read-only)</div>
          <div className="sub">無料運用版：変更は環境変数／public差し替え</div>
        </div>
      </header>

      <div className="card">
        <div className="cardTitle">現在のLP設定</div>
        <div className="cardDesc">
          変更はホスティング（Vercel等）の環境変数更新＋再デプロイ、または public/bg.jpeg / public/logo.png の差し替えで行います。
        </div>

        <div className="note">
          <div>LP_ACCESS_PASSWORD：{hasPass ? "設定済み" : "未設定"}</div>
          <div>LP_BG_URL：{bgUrl}</div>
          <div>LP_LOGO_URL：{logoUrl}</div>
        </div>

        <div className="note">
          <div>※強制ログアウトなし：既に認証済み端末は最大30日入れます。</div>
        </div>

        <div className="row" style={{ alignItems: "center" }}>
          <img
            src={logoUrl}
            alt="logo preview"
            width={44}
            height={44}
            style={{
              width: 44, height: 44, borderRadius: 14,
              objectFit: "cover",
              border: "1px solid rgba(2,6,23,0.15)"
            }}
          />
          <div className="small">logo preview</div>
        </div>
      </div>
    </main>
  );
}