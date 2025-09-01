
"use client";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

// Metadata cannot be defined in a client component, so we move it to a higher-level layout if needed
// or handle it dynamically. For this case, we'll remove it from the client component.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title key="title">PathFinder AI</title>
        <meta name="description" content="AI-powered career guidance for the African job market." key="description" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" key="manifest" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" key="favicon" />
        <meta name="theme-color" content="#6d28d9" key="theme-color" />
        <link rel="preconnect" href="https://fonts.googleapis.com" key="preconnect-fonts" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" key="preconnect-gstatic" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
          key="font-space-grotesk"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
