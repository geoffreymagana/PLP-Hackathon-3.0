
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Compass, GitMerge, LayoutDashboard, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/my-roadmaps", icon: <GitMerge />, label: "Roadmap" },
    { href: "/check-in", icon: <Bot />, label: "Chat" },
    { href: "/explore", icon: <Compass />, label: "Explore" },
    { href: "/connect", icon: <Users />, label: "Connect" },
  ];
  
  const mobileNavItems = navItems.filter(item => item.href !== '/connect');


  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar className="hidden md:flex md:flex-col">
        <div className="border-b p-2">
            <Logo />
        </div>
        <SidebarContent className="flex-1 p-2">
            <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton isActive={pathname === item.href} tooltip={{ children: item.label }}>
                    {item.icon}
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto p-2">
            <UserNav />
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav items={mobileNavItems} />
    </div>
  );
}
