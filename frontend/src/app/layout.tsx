'use client';

import { Roboto, Noto_Serif } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider, App as AntdApp } from 'antd';
import { antdTheme } from './antd.config';
import { StyleProvider } from '@ant-design/cssinjs';
import './globals.css';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  weight: ['400', '700'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-noto-serif',
  display: 'swap',
});

// Metadata is now in metadata.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="vi" 
      className={`${roboto.variable} ${notoSerif.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased font-sans">
        <StyleProvider hashPriority="high">
          <ConfigProvider
            theme={antdTheme}
            componentSize="middle"
            getPopupContainer={node => {
              if (node) {
                return node.parentElement || document.body;
              }
              return document.body;
            }}
          >
            <AntdApp>
              <AuthProvider>
                <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
                </div>
              </AuthProvider>
            </AntdApp>
          </ConfigProvider>
        </StyleProvider>
      </body>
    </html>
  );
}
