import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "VibeWeather | Bảng Theo Dõi Thời Tiết",
  description: "Ứng dụng theo dõi thời tiết cục bộ với phong cách Glassmorphism, hỗ trợ đa ngôn ngữ và dữ liệu thời gian thực từ OpenWeatherMap.",
};  

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
