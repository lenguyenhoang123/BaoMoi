'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ConfigProvider, Spin } from 'antd';
import { antdTheme } from './antd.config';
import { StyleProvider } from '@ant-design/cssinjs';
import { MessageProvider } from '@/components/providers/MessageProvider';
import './globals.css';

// Dynamic import for better performance
const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
  loading: () => <div className="h-16 bg-white shadow-sm"></div>
});

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100"></div>
});

const AuthProvider = dynamic(
  () => import('@/contexts/AuthContext').then(mod => mod.AuthProvider),
  { ssr: false }
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" />
  </div>
);

// Metadata is now in metadata.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="vi" 
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased font-sans">
        <StyleProvider hashPriority="high">
          <MessageProvider>
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
              <AuthProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      {children}
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              </AuthProvider>
            </ConfigProvider>
          </MessageProvider>
        </StyleProvider>
      </body>
    </html>
  );
}
