
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Award, Check, ChevronDown, ChevronUp, Crown, Lightbulb, Lock, Target, Telescope, Trophy, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis } from 'recharts';
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
  createdAt: string;
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
    learningVelocity: number;
    dropOffAnalysis: { career: string, step: string } | null;
    industryDemand: { score: number, trend: 'up' | 'stable' };
    learningBalance: { hard: number; soft: number };
};

// Mock data/logic for new analytics
const MOCK_SOFT_SKILLS = ['Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Time Management', 'Adaptability'];
const MOCK_INDUSTRY_DEMAND: Record<string, { score: number, trend: 'up' | 'stable' }> = {
    "Software Engineer": { score: 92, trend: 'up' },
    "Data Scientist": { score: 88, trend: 'up' },
    "Cybersecurity Analyst": { score: 85, trend: 'up' },
    "Digital Marketer": { score: 78, trend: 'stable' },
    "default": { score: 75, trend: 'stable' }
};

function calculateProgress(userProfile: UserProfile | null): ProgressData {
    const emptyData = { totalMilestones: 0, totalMilestonesCompleted: 0, totalSkillsGained: 0, roadmapsInProgress: 0, recentMilestones: [], acquiredSkills: [], overallProgressChartData: [], skillsDistributionChartData: [], roadmapComparisonChartData: [], learningVelocity: 0, dropOffAnalysis: null, industryDemand: { score: 75, trend: 'stable' }, learningBalance: { hard: 0, soft: 0 } };
    if (!userProfile?.savedRoadmaps) {
        return emptyData;
    }

    let totalMilestones = 0;
    let totalMilestonesCompleted = 0;
    const acquiredSkills = new Set<string>();
    const recentMilestones: { text: string; career: string }[] = [];
    const skillsDistribution: Record<string, number> = {};
    const roadmapComparison: { career: string; progress: number; fullMark: number }[] = [];
    let totalDays = 0;
    let totalRoadmapsForVelocity = 0;
    let leastProgressiveRoadmap: { progress: number, career: string, step: string } | null = null;
    let hardSkillsCount = 0;
    let softSkillsCount = 0;

    userProfile.savedRoadmaps.forEach((roadmap) => {
        const roadmapTotalMilestones = roadmap.roadmap.reduce((acc, step) => acc + step.milestones.length, 0);
        totalMilestones += roadmapTotalMilestones;

        const completedCount = Object.values(roadmap.completedMilestones || {}).reduce((acc, step) => acc + Object.values(step).filter(Boolean).length, 0);
        totalMilestonesCompleted += completedCount;
        
        const progress = roadmapTotalMilestones > 0 ? (completedCount / roadmapTotalMilestones) : 0;
        
        // For drop off analysis
        if (leastProgressiveRoadmap === null || progress < leastProgressiveRoadmap.progress) {
            const firstUncompletedStep = roadmap.roadmap.findIndex((step, sIdx) => !step.milestones.every((_, mIdx) => roadmap.completedMilestones?.[sIdx]?.[mIdx]));
            leastProgressiveRoadmap = {
                progress,
                career: roadmap.career,
                step: firstUncompletedStep !== -1 ? roadmap.roadmap[firstUncompletedStep].step : "Final review"
            };
        }
        
        // For learning velocity
        if(completedCount > 0 && roadmap.createdAt) {
            const days = (new Date().getTime() - new Date(roadmap.createdAt).getTime()) / (1000 * 3600 * 24);
            if (days > 1) {
                totalDays += days;
                totalRoadmapsForVelocity++;
            }
        }

        roadmapComparison.push({
            career: roadmap.career,
            progress: Math.round(progress * 100),
            fullMark: 100
        });

        roadmap.roadmap.forEach(step => {
            step.skills.forEach(skill => {
                const trimmedSkill = skill.trim();
                skillsDistribution[trimmedSkill] = (skillsDistribution[trimmedSkill] || 0) + 1;
                if(MOCK_SOFT_SKILLS.includes(trimmedSkill)){
                    softSkillsCount++;
                } else {
                    hardSkillsCount++;
                }
            });
        });

        Object.entries(roadmap.completedMilestones || {}).forEach(([stepIndex, milestones]) => {
            Object.entries(milestones).forEach(([milestoneIndex, isCompleted]) => {
                if(isCompleted) {
                    const step = roadmap.roadmap[parseInt(stepIndex)];
                    if (step) {
                        step.skills.forEach(skill => acquiredSkills.add(skill.trim()));
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

    const learningVelocity = totalRoadmapsForVelocity > 0 ? totalMilestonesCompleted / totalRoadmapsForVelocity : 0;
    
    // Aggregate industry demand
    const avgIndustryDemand = userProfile.savedRoadmaps.reduce((acc, roadmap) => {
        const demand = MOCK_INDUSTRY_DEMAND[roadmap.career] || MOCK_INDUSTRY_DEMAND.default;
        return {
            score: acc.score + demand.score,
            isUp: acc.isUp || demand.trend === 'up'
        };
    }, { score: 0, isUp: false });
    const finalIndustryDemand = {
        score: userProfile.savedRoadmaps.length > 0 ? Math.round(avgIndustryDemand.score / userProfile.savedRoadmaps.length) : MOCK_INDUSTRY_DEMAND.default.score,
        trend: avgIndustryDemand.isUp ? 'up' : 'stable'
    } as { score: number, trend: 'up' | 'stable' };

    return {
        totalMilestones,
        totalMilestonesCompleted,
        totalSkillsGained: acquiredSkills.size,
        roadmapsInProgress: userProfile.savedRoadmaps.length,
        recentMilestones: recentMilestones.slice(-5).reverse(),
        acquiredSkills: Array.from(acquiredSkills),
        overallProgressChartData,
        skillsDistributionChartData,
        roadmapComparisonChartData: roadmapComparison,
        learningVelocity,
        dropOffAnalysis: leastProgressiveRoadmap && leastProgressiveRoadmap.progress < 0.9 ? { career: leastProgressiveRoadmap.career, step: leastProgressiveRoadmap.step } : null,
        industryDemand: finalIndustryDemand,
        learningBalance: { hard: hardSkillsCount, soft: softSkillsCount }
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
        color: "hsl(var(--primary))"
    }
} satisfies ChartConfig;

const learningBalanceChartConfig = {
    hard: {
        label: "Hard Skills",
        color: "hsl(var(--primary))",
    },
    soft: {
        label: "Soft Skills",
        color: "hsl(var(--accent))"
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

const PaywallWrapper = ({ isProUser, children, title, description }: { isProUser?: boolean, children: React.ReactNode, title: string, description: string }) => {
    if (isProUser) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            <div className="blur-sm pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg text-center p-4">
                <div className="p-2 bg-primary/10 rounded-full mb-2">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{description}</p>
                <Link href="/pricing">
                    <Button size="sm">
                        <Crown className="mr-2 h-4 w-4"/>
                        Unlock with Pro
                    </Button>
                </Link>
            </div>
        </div>
    );
};


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
                    <p className="text-muted-foreground">Track your journey across all your learning roadmaps.</p>
                </header>
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No progress to show yet.</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Save a roadmap and complete milestones to see your progress here.</p>
                    <Link href="/explore">
                        <Button>Explore Learning Paths</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { totalMilestones, totalMilestonesCompleted, roadmapsInProgress, recentMilestones, acquiredSkills, overallProgressChartData, skillsDistributionChartData, roadmapComparisonChartData, learningVelocity, dropOffAnalysis, industryDemand, learningBalance } = progressData;
    const completionRate = totalMilestones > 0 ? Math.round(totalMilestonesCompleted / totalMilestones * 100) : 0;
    
    const finalSkillsData = skillsDistributionChartData.slice(0, 8);
    const totalBalance = learningBalance.hard + learningBalance.soft;
    const hardSkillPercentage = totalBalance > 0 ? (learningBalance.hard / totalBalance) * 100 : 0;
    const softSkillPercentage = totalBalance > 0 ? 100 - hardSkillPercentage : 0;


    const AdvancedAnalytics = () => (
         <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight font-headline">Advanced Analytics</h2>
                <p className="text-muted-foreground">Deeper insights into your learning journey.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                 <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Learning Balance" description="See your hard vs. soft skills ratio.">
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Balance</CardTitle>
                            <CardDescription>Ratio of hard skills vs. soft skills in your roadmaps.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={learningBalanceChartConfig} className="h-10 w-full border rounded-lg">
                                {totalBalance > 0 ? (
                                    <BarChart
                                        accessibilityLayer
                                        layout="vertical"
                                        data={[{ name: "balance", hard: learningBalance.hard, soft: learningBalance.soft }]}
                                        stackOffset="expand"
                                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                    >
                                        <XAxis type="number" dataKey="name" hide />
                                        <YAxis type="category" dataKey="name" hide />
                                        <Tooltip content={null} cursor={false} />
                                        <Bar dataKey="hard" fill="var(--color-hard)" stackId="a" radius={[5, 0, 0, 5]} />
                                        <Bar dataKey="soft" fill="var(--color-soft)" stackId="a" radius={[0, 5, 5, 0]} />
                                    </BarChart>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No skill data</div>
                                )}
                            </ChartContainer>
                             <div className="flex justify-between text-sm font-medium text-muted-foreground mt-2">
                                <span>Hard Skills ({Math.round(hardSkillPercentage)}%)</span>
                                <span>Soft Skills ({Math.round(softSkillPercentage)}%)</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">A balanced portfolio of skills is attractive to employers.</p>
                        </CardFooter>
                    </Card>
                 </PaywallWrapper>
                 <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Learning Velocity" description="Track your average pace of progress.">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Learning Velocity</CardTitle>
                                <CardDescription>Your average pace of completing milestones.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {learningVelocity.toFixed(1)} <span className="text-lg font-medium text-muted-foreground">milestones/day</span>
                            </p>
                        </CardContent>
                    </Card>
                </PaywallWrapper>
                <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Industry Demand" description="See how your skills match market trends.">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Telescope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Industry Demand Index</CardTitle>
                                <CardDescription>Relevance of your skills in the current job market.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{industryDemand.score}/100</p>
                            {industryDemand.trend === 'up' 
                                ? <span className="flex items-center text-sm font-medium text-green-500"><ChevronUp/> Trending Up</span>
                                : <span className="flex items-center text-sm font-medium text-muted-foreground"><ChevronDown/> Stable</span>
                            }
                        </CardContent>
                    </Card>
                </PaywallWrapper>
                {dropOffAnalysis && (
                    <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Growth Opportunity" description="Find out where to focus your efforts.">
                        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
                                    <Target className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-amber-900 dark:text-amber-100">Growth Opportunity</CardTitle>
                                    <CardDescription className="text-amber-700 dark:text-amber-300">Area to focus on for improvement.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">You seem to be slowing down on the <span className="font-bold text-foreground">{dropOffAnalysis.career}</span> roadmap. Try focusing on the next step: <span className="font-bold text-foreground">{`"${dropOffAnalysis.step}"`}</span>.</p>
                            </CardContent>
                        </Card>
                    </PaywallWrapper>
                )}
            </div>
             <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Skills Distribution" description="Visualize your top skill areas.">
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills Distribution</CardTitle>
                                <CardDescription>A spider chart showing your top 8 skill areas from your roadmaps.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={skillsRadarChartConfig} className="h-80 w-full">
                                    <RadarChart data={finalSkillsData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: isMobile ? 8 : 12 }} />
                                        <PolarRadiusAxis angle={isMobile ? 90 : 30} tick={!isMobile} domain={[0, 'dataMax + 1']}/>
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Radar name="Count" dataKey="count" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.6} />
                                    </RadarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </PaywallWrapper>
                </div>
                <div className="lg:col-span-2">
                    <PaywallWrapper isProUser={userProfile?.isProUser} title="Unlock Roadmap Comparison" description="Compare your progress across roadmaps.">
                        <Card>
                            <CardHeader>
                                <CardTitle>Roadmap Comparison</CardTitle>
                                <CardDescription>Your progress in each saved roadmap.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={comparisonChartConfig} className="h-80 w-full">
                                    <RadarChart data={roadmapComparisonChartData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="career" tick={{ fontSize: isMobile ? 8 : 12, width: 70 }}/>
                                        <PolarRadiusAxis domain={[0, 100]}/>
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Radar name="Progress" dataKey="progress" stroke="var(--color-progress)" fill="var(--color-progress)" fillOpacity={0.6} />
                                    </RadarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </PaywallWrapper>
                </div>
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
                                    <li key={`${milestone.text}-${index}`} className="flex items-start gap-3">
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

            <AdvancedAnalytics />
        </div>
    );
}
