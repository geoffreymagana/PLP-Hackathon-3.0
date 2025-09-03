
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type UsageLimitItem = {
    name: string;
    usage: number;
    limit: number;
};

interface UsageLimitCardProps {
    title: string;
    description: string;
    items: UsageLimitItem[];
    isProUser: boolean;
}

export function UsageLimitCard({ title, description, items, isProUser }: UsageLimitCardProps) {

    const getProgressColor = (percentage: number) => {
        if (percentage > 90) return "bg-destructive";
        if (percentage > 70) return "bg-yellow-500";
        return "bg-primary";
    };

    const tooltipContent = isProUser 
        ? "You have Pro access with our highest usage limits. If you have specific needs for even higher limits, please contact support."
        : "These are your daily limits for AI features. Limits reset every 24 hours. Upgrade to Pro for significantly higher limits.";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>{title}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>{tooltipContent}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {items.map((item) => {
                    const percentage = (item.usage / item.limit) * 100;
                    return (
                        <div key={item.name}>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    <span className={cn(percentage > 90 && "text-destructive font-semibold")}>
                                        {item.usage}
                                    </span> / {item.limit}
                                </p>
                            </div>
                             <Progress value={percentage} indicatorClassName={getProgressColor(percentage)} />
                        </div>
                    );
                })}
            </CardContent>
            {!isProUser && (
                <CardFooter>
                    <Link href="/pricing" className="w-full">
                        <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                            <Crown className="mr-2 h-4 w-4" />
                            Upgrade for Higher Limits
                        </Button>
                    </Link>
                </CardFooter>
            )}
        </Card>
    );
}
