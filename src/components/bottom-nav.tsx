
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";
import { useIsMobile } from "@/hooks/use-mobile";

type BottomNavProps = {
    items: {
        href: string;
        icon: React.ReactNode;
        label: string;
    }[];
};

export function BottomNav({ items }: BottomNavProps) {
    const pathname = usePathname();
    const isMobile = useIsMobile();

    if (!isMobile) {
        return null;
    }
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "w-5 h-5 mb-1"})}
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    );
                })}
                <div className="inline-flex flex-col items-center justify-center group">
                     <UserNav />
                </div>
            </div>
        </div>
    );
}
