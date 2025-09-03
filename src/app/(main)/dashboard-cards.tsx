
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, GitMerge, Users, Award } from "lucide-react";

const cardData = [
    {
        href: "/explore",
        icon: <Compass />,
        title: "Explore Learning Paths",
        description: "Browse a directory of trending skills and careers.",
        color: "bg-blue-500"
    },
    {
        href: "/my-roadmaps",
        icon: <GitMerge />,
        title: "My Roadmaps",
        description: "View and manage your active learning roadmaps.",
        color: "bg-green-500"
    },
    {
        href: "/progress",
        icon: <Award />,
        title: "My Progress",
        description: "Track your skills and milestone achievements.",
        color: "bg-purple-500"
    },
    {
        href: "/connect",
        icon: <Users />,
        title: "Connect",
        description: "Find mentors and join learning communities.",
        color: "bg-orange-500"
    }
];

export function DashboardCards() {
    return (
        <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cardData.map((card, index) => (
                    <Link href={card.href} key={card.href} className="group">
                        <Card className="h-full hover:border-primary transition-colors hover:shadow-lg overflow-hidden relative">
                            <div className={`absolute left-0 top-0 w-1.5 h-full ${card.color}`} />
                            <CardHeader className="space-y-3">
                                <div className={`p-3 bg-muted rounded-full w-fit group-hover:bg-opacity-10 ${card.color.replace('bg-', 'group-hover:text-')} transition-colors`}>
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
