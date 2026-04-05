import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";
import { Header } from "./components/ui/Header";

export const metadata: Metadata = {
  title: "Moim - 모임 관리 앱",
  description: "쉽고 편리한 모임 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
