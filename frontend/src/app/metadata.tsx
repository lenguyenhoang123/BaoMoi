import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Báo Mới - Tin tức 24h, tin nhanh, tin mới nhất trong ngày",
  description: "Báo Mới - Đọc báo, tin tức online cập nhật mới nhất 24h trong ngày về thời sự, chính trị, kinh tế, pháp luật, thế giới, công nghệ, sức khỏe, thể thao, giải trí, đời sống",
  keywords: ["báo mới", "tin tức", "tin tức 24h", "báo điện tử", "tin nhanh", "tin mới nhất", "thời sự", "chính trị", "kinh tế", "pháp luật"],
  authors: [{ name: 'Báo Mới' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Báo Mới - Tin tức 24h',
    description: 'Cập nhật tin tức mới nhất trong ngày',
    locale: 'vi_VN',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};
