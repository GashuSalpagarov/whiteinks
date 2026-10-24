import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from "@/lib/site";
import { GlobalCanvas } from "@/r3f/GlobalCanvas";
import { Providers } from "./providers";
import "./globals.css";

// Общие метаданные. Canonical и Open Graph главной — в page.tsx: здесь они достались бы
// и юридическим страницам. Значки — файлы app/icon.svg (на тёмной полосе вкладок точка белая),
// icon1.ico (16 и 32 для старых браузеров; не favicon.ico — его Next не ставит на главную)
// и apple-icon.png; картинка для соцсетей — app/opengraph-image.png
// (подпись к ней — opengraph-image.alt.txt).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <GlobalCanvas />
          {children}
        </Providers>
      </body>
    </html>
  );
}
