
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
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
        <title>PathFinder AI</title>
        <meta name="description" content="AI-powered career guidance for the African job market." />
        <link rel="manifest" href="/manifest.json" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#6d28d9" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <SidebarProvider>
            <AppShell>{children}</AppShell>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
