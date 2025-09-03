
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, GitMerge, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const cardData = [
    {
        href: "/explore",
        icon: <Compass />,
        title: "Explore Careers",
        description: "Browse a directory of trending careers in Africa.",
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
        borderColor: "border-blue-500"
    },
    {
        href: "/my-roadmaps",
        icon: <GitMerge />,
        title: "My Roadmaps",
        description: "View and manage your active career roadmaps.",
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
        borderColor: "border-purple-500"
    },
    {
        href: "/progress",
        icon: <Award />,
        title: "Progress",
        description: "Track your skills and milestone achievements.",
        color: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
        borderColor: "border-green-500"
    },
    {
        href: "/connect",
        icon: <Users />,
        title: "Connect",
        description: "Find mentors and join tech communities.",
        color: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
        borderColor: "border-orange-500"
    }
];

export function DashboardCards() {
    return (
        <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cardData.map((card, index) => (
                    <Link href={card.href} key={index} className="group">
                        <Card className={cn("h-full hover:border-primary transition-colors hover:shadow-lg border-l-4", card.borderColor)}>
                            <CardHeader className="space-y-3">
                                <div className={cn("p-3 rounded-full w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors", card.color)}>
                                    {card.icon}
                                </div>
                                <CardTitle>{card.title}</CardTitle>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
