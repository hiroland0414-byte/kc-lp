"use client";

import { useEffect, useState } from "react";

export default function PortfolioList() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "future" | "es" | "interview">("all");

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem("kcareer_portfolio") || "[]"
    );
    setPortfolio(data.reverse());
  }, []);

  // ===== スコア表示（★） =====
  function renderStars(n: number) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  const filtered = portfolio.filter((item) =>
    filter === "all" ? true : item.type === filter
  );

  // ===== 一覧画面 =====
  if (!selected) {
    return (
      <div style={{ marginBottom: 12 }}>
        {/* ===== タグフィルター ===== */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["all", "future", "es", "interview"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === t
                  ? "bg-blue-500 text-white"
                  : "bg-white border text-gray-600"
              }`}
            >
              {t === "all"
                ? "すべて"
                : t === "future"
                ? "未来"
                : t === "es"
                ? "ES"
                : "面接"}
            </button>
          ))}
        </div>

        {/* ===== データなし ===== */}
        {filtered.length === 0 && (
          <div className="glass text-center text-sm text-gray-500 p-3">
            該当データがありません
          </div>
        )}

        {/* ===== 一覧 ===== */}
        {filtered.map((item, index) => (
          <div
            key={index}
            className="glass"
            style={{
              marginBottom: 10,
              padding: 12,
              borderRadius: 14,
              cursor: "pointer",
            }}
            onClick={() => setSelected(item)}
          >
            <div className="text-xs text-gray-500 mb-1">
              {new Date(item.date).toLocaleString()}
            </div>

            {/* タイプ */}
            <div className="text-xs text-blue-500 mb-1">
              {item.type}
            </div>

            {/* スコア */}
            {item.score && (
  <div className="text-xs text-orange-500 mb-1">
    明: {renderStars(item.score.clarity || 0)}　
    深: {renderStars(item.score.depth || 0)}　
    行: {renderStars(item.score.action || 0)}
  </div>
)}

            {/* タイトル */}
            <div className="text-sm font-bold line-clamp-2">
              {item.answers?.[0]}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ===== 詳細画面 =====
  return (
    <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
      <button
        onClick={() => setSelected(null)}
        className="mb-4 text-sm text-blue-500"
      >
        ← 一覧に戻る
      </button>

      <div className="text-xs text-gray-400 mb-3">
        {new Date(selected.date).toLocaleString()}
      </div>

      {/* スコア */}
{selected.score && (
  <>
    <div className="text-sm font-bold mb-1">評価</div>

    <div className="text-sm text-orange-500 mb-1">
      明確さ：{renderStars(selected.score.clarity || 0)}
    </div>

    <div className="text-sm text-orange-500 mb-1">
      深さ：{renderStars(selected.score.depth || 0)}
    </div>

    <div className="text-sm text-orange-500 mb-3">
      行動力：{renderStars(selected.score.action || 0)}
    </div>
  </>
)}

      <div className="text-sm font-bold mb-1">将来像</div>
      <div className="text-sm mb-3">{selected.answers?.[0]}</div>

      <div className="text-sm font-bold mb-1">価値観</div>
      <div className="text-sm mb-3">{selected.answers?.[1]}</div>

      <div className="text-sm font-bold mb-1">社会での活用</div>
      <div className="text-sm mb-3">{selected.answers?.[2]}</div>

      <div className="text-sm font-bold mb-1">やりたい経験</div>
      <div className="text-sm mb-3">{selected.answers?.[3]}</div>

      <div className="text-sm font-bold mb-1">行動</div>
      <div className="text-sm text-blue-600 mb-4">
        {selected.action}
      </div>

      <div className="text-sm font-bold mb-1">気づき</div>
      <div className="text-sm mb-2">{selected.reflection?.notice}</div>

      <div className="text-sm font-bold mb-1">良かった点</div>
      <div className="text-sm mb-2">{selected.reflection?.good}</div>

      <div className="text-sm font-bold mb-1">改善点</div>
      <div className="text-sm">
        {selected.reflection?.improve}
      </div>
    </div>
  );
}