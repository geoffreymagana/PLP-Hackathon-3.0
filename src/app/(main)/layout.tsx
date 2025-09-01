"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { checkAndUpdateProStatus } from "@/lib/subscription";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check and update pro status on each page load
        await checkAndUpdateProStatus(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
