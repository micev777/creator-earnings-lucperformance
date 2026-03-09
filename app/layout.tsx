import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Earnings Dashboard",
  description: "Track your ad performance and earnings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
