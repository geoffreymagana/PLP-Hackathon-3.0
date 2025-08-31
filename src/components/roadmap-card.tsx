
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitMerge } from "lucide-react";
import { Badge } from "./ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-xs bg-background border rounded-md shadow-lg">
        <p className="font-bold">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};


export function RoadmapCard({ roadmap, showViewButton = false }: { roadmap: any, showViewButton?: boolean }) {
    const totalSteps = roadmap.roadmap?.length || 0;
    const totalMilestones = roadmap.roadmap?.reduce((acc: number, step: any) => acc + (step.milestones?.length || 0), 0) || 0;

    const completedMilestonesCount = Object.values(roadmap.completedMilestones || {}).reduce((acc: number, step: any) => acc + Object.values(step).filter(Boolean).length, 0);
    const progressPercentage = totalMilestones > 0 ? Math.round((completedMilestonesCount / totalMilestones) * 100) : 0;
    
    const progressData = [
        { name: 'Completed', value: progressPercentage },
        { name: 'Remaining', value: 100 - progressPercentage },
    ];

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

    return (
        <Card className="flex flex-col h-full group hover:shadow-lg hover:border-primary transition-all duration-300">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">{roadmap.career}</CardTitle>
                        <CardDescription>
                            A guide to becoming a {roadmap.career}.
                        </CardDescription>
                    </div>
                    <GitMerge className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{totalSteps} Steps</Badge>
                        <Badge variant="secondary">{totalMilestones} Milestones</Badge>
                    </div>
                     <div className="w-16 h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    startAngle={90}
                                    endAngle={450}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {progressData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-lg font-bold fill-foreground"
                                >
                                    {`${progressPercentage}%`}
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2">Current Focus:</h4>
                    <p className="text-sm text-muted-foreground">{roadmap.roadmap?.[0]?.step}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 {showViewButton || !roadmap.createdAt ? (
                    <Link href={`/roadmap?career=${encodeURIComponent(roadmap.career)}`} passHref className="w-full">
                        <Button variant="outline" className="w-full">
                            {showViewButton ? "View Roadmap" : "Continue Roadmap"}
                            <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                ) : (
                     <p className="text-xs text-muted-foreground">Saved on {new Date(roadmap.createdAt).toLocaleDateString()}</p>
                )}
            </CardFooter>
        </Card>
    );
}

