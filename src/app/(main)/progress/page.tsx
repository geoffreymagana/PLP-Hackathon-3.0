"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Award, Check, Crown, Lightbulb, Lock, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Bar, BarChart, XAxis, YAxis, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";

type Roadmap = {
  career: string;
  roadmap: {
    step: string;
    skills: string[];
    milestones: string[];
  }[];
  completedMilestones: Record<string, Record<string, boolean>>;
};

type UserProfile = {
  savedRoadmaps?: Roadmap[];
  isProUser?: boolean;
};

type ProgressData = {
    totalMilestones: number;
    totalMilestonesCompleted: number;
    totalSkillsGained: number;
    roadmapsInProgress: number;
    recentMilestones: { text: string; career: string }[];
    acquiredSkills: string[];
    overallProgressChartData: { name: string; value: number; fill: string }[];
    skillsDistributionChartData: { skill: string; count: number }[];
    roadmapComparisonChartData: { career: string; progress: number; fullMark: number }[];
};

function calculateProgress(userProfile: UserProfile | null): ProgressData {
    if (!userProfile?.savedRoadmaps) {
        return { totalMilestones: 0, totalMilestonesCompleted: 0, totalSkillsGained: 0, roadmapsInProgress: 0, recentMilestones: [], acquiredSkills: [], overallProgressChartData: [], skillsDistributionChartData: [], roadmapComparisonChartData: [] };
    }

    let totalMilestones = 0;
    let totalMilestonesCompleted = 0;
    const acquiredSkills = new Set<string>();
    const recentMilestones: { text: string; career: string }[] = [];
    const skillsDistribution: Record<string, number> = {};
    const roadmapComparison: { career: string; progress: number; fullMark: number }[] = [];

    userProfile.savedRoadmaps.forEach((roadmap) => {
        const roadmapTotalMilestones = roadmap.roadmap.reduce((acc, step) => acc + step.milestones.length, 0);
        totalMilestones += roadmapTotalMilestones;

        const completedCount = Object.values(roadmap.completedMilestones || {}).reduce((acc, step) => acc + Object.values(step).filter(Boolean).length, 0);
        totalMilestonesCompleted += completedCount;
        
        roadmapComparison.push({
            career: roadmap.career,
            progress: roadmapTotalMilestones > 0 ? Math.round((completedCount / roadmapTotalMilestones) * 100) : 0,
            fullMark: 100
        });

        roadmap.roadmap.forEach(step => {
            step.skills.forEach(skill => {
                skillsDistribution[skill] = (skillsDistribution[skill] || 0) + 1;
            });
        });

        Object.entries(roadmap.completedMilestones || {}).forEach(([stepIndex, milestones]) => {
            Object.entries(milestones).forEach(([milestoneIndex, isCompleted]) => {
                if(isCompleted) {
                    const step = roadmap.roadmap[parseInt(stepIndex)];
                    if (step) {
                        step.skills.forEach(skill => acquiredSkills.add(skill));
                        const milestoneText = step.milestones[parseInt(milestoneIndex)];
                        if (milestoneText) {
                            recentMilestones.push({ text: milestoneText, career: roadmap.career });
                        }
                    }
                }
            });
        });
    });

    const remainingMilestones = totalMilestones - totalMilestonesCompleted;
    const overallProgressChartData = [
        { name: 'Completed', value: totalMilestonesCompleted, fill: 'hsl(var(--primary))' },
        { name: 'Remaining', value: remainingMilestones, fill: 'hsl(var(--muted))' }
    ];

    const skillsDistributionChartData = Object.entries(skillsDistribution)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count);
    
    return {
        totalMilestones,
        totalMilestonesCompleted,
        totalSkillsGained: acquiredSkills.size,
        roadmapsInProgress: userProfile.savedRoadmaps.length,
        recentMilestones: recentMilestones.slice(-5).reverse(), // Last 5
        acquiredSkills: Array.from(acquiredSkills),
        overallProgressChartData,
        skillsDistributionChartData,
        roadmapComparisonChartData: roadmapComparison
    };
}

const overallChartConfig = {
  milestones: {
    label: "Milestones",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--primary))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

const skillsRadarChartConfig = {
    count: {
        label: "Count",
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig;

const comparisonChartConfig = {
    progress: {
        label: "Progress %",
        color: "hsl(var(--chart-1))"
    }
} satisfies ChartConfig;

function ProgressSkeleton() {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-pulse">
            <header className="space-y-2">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </header>
            <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </div>
        </div>
    );
}

const ProPaywallCard = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-lg">
            <div className="text-center p-8 space-y-4">
                <Crown className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-2xl font-bold">Unlock Advanced Analytics</h3>
                <p className="text-muted-foreground">
                    Upgrade to Pro to access detailed charts and gain deeper insights into your career progress.
                </p>
                <Link href="/pricing">
                    <Button size="lg">
                        <Lock className="mr-2"/>
                        Upgrade to Pro
                    </Button>
                </Link>
            </div>
        </div>
    </div>
);

export default function ProgressPage() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMobile = useIsMobile();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                }
                setIsLoading(false);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (isLoading) {
        return <ProgressSkeleton />;
    }

    const progressData = calculateProgress(userProfile);

    if (!userProfile?.savedRoadmaps || userProfile.savedRoadmaps.length === 0) {
        return (
             <div className="p-4 md:p-8 space-y-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">My Progress</h1>
                    <p className="text-muted-foreground">Track your journey across all your career roadmaps.</p>
                </header>
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No progress to show yet.</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Save a roadmap and complete milestones to see your progress here.</p>
                    <Link href="/explore">
                        <Button>Explore Careers</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { totalMilestones, totalMilestonesCompleted, roadmapsInProgress, recentMilestones, acquiredSkills, overallProgressChartData, skillsDistributionChartData, roadmapComparisonChartData } = progressData;
    const completionRate = totalMilestones > 0 ? Math.round(totalMilestonesCompleted / totalMilestones * 100) : 0;
    
    const finalSkillsData = skillsDistributionChartData.slice(0, 8);


    const AdvancedAnalytics = () => (
         <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight font-headline">Advanced Analytics</h2>
                <p className="text-muted-foreground">Deeper insights into your career journey.</p>
            </div>
             <div className="grid lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Skills Distribution</CardTitle>
                        <CardDescription>A spider chart showing your top 8 skill areas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={skillsRadarChartConfig} className="h-80 w-full">
                           <ResponsiveContainer width="100%" height={300}>
                               <RadarChart data={finalSkillsData}>
                                   <PolarGrid />
                                   <PolarAngleAxis dataKey="skill" tick={{ fontSize: isMobile ? 8 : 12 }} />
                                   <PolarRadiusAxis angle={isMobile ? 90 : 30} tick={!isMobile} domain={[0, 'dataMax + 1']}/>
                                   <Tooltip content={<ChartTooltipContent />} />
                                   <Radar name="Count" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                               </RadarChart>
                           </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Roadmap Comparison</CardTitle>
                        <CardDescription>Your progress in each saved roadmap.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={comparisonChartConfig} className="h-80 w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={roadmapComparisonChartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="career" tick={{ fontSize: isMobile ? 8 : 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={!isMobile} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Radar name="Progress" dataKey="progress" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">My Progress</h1>
                <p className="text-muted-foreground">An overview of your achievements and skills acquired.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Milestones Completed</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMilestonesCompleted}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Skills Gained</CardTitle>
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acquiredSkills.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Roadmaps in Progress</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{roadmapsInProgress}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Progress</CardTitle>
                        <CardDescription>Your total milestone completion across all roadmaps.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                         <ChartContainer 
                            config={overallChartConfig} 
                            className="h-64 mx-auto aspect-square"
                         >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={overallProgressChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="60%"
                                        strokeWidth={5}
                                        >
                                     <Cell
                                        key="completed"
                                        fill="var(--color-completed)"
                                        stroke="var(--color-completed)"
                                    />
                                    <Cell
                                        key="remaining"
                                        fill="var(--color-remaining)"
                                        stroke="var(--color-remaining)"
                                    />
                                    </Pie>
                                     <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-foreground text-3xl font-bold"
                                    >
                                        {completionRate.toFixed(0)}%
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm pt-4">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            Completed: {totalMilestonesCompleted} of {totalMilestones} milestones
                        </div>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recently Completed Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {recentMilestones.length > 0 ? (
                            <ul className="space-y-4">
                                {recentMilestones.map((milestone, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="bg-primary/10 text-primary p-1.5 rounded-full mt-1">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{milestone.text}</p>
                                            <p className="text-xs text-muted-foreground">{milestone.career}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-8">
                                No milestones completed yet. Start working on a roadmap to see your progress!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Acquired Skills</CardTitle>
                    <CardDescription>All the skills you have gained from completed roadmap steps.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {acquiredSkills.length > 0 ? (
                        acquiredSkills.map(skill => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))
                    ) : (
                         <p className="text-muted-foreground text-sm">No skills acquired yet.</p>
                    )}
                </CardContent>
            </Card>

            {userProfile?.isProUser ? (
                <AdvancedAnalytics />
            ) : (
                <ProPaywallCard>
                    <AdvancedAnalytics />
                </ProPaywallCard>
            )}

        </div>
    );
}
