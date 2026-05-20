import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPilot",
  description: "个人股票复盘工作站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
