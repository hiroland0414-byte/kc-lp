import "./globals.css";

export const metadata = {
  title: "K-career Hub",
  description: "interview-pod / es-trainer 統合入口"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}