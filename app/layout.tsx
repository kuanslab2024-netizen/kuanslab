import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUANS LAB 寬私廚｜椒香紅燒牛肉麵",
  description: "餐廳級熟製、冷凍宅配。72 小時慢熬湯底，12 分鐘把私廚帶回家。",
  icons: { icon: "/kuanslab/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
