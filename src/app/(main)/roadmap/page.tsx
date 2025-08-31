"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generateRoadmap, type RoadmapGenerationOutput } from "@/ai/flows/roadmap-generation";
import { Crown, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type UserProfile = {
  skills: string;
  interests: string;
  education: string;
  location: string;
  savedRoadmaps?: any[];
  completedMilestones?: Record<string, Record<string, boolean>>;
  isProUser?: boolean;
};

type RoadmapData = RoadmapGenerationOutput & { career: string; createdAt: string; completedMilestones?: Record<string, Record<string, boolean>> };

function RoadmapSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-muted rounded-md w-3/4"></div>
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="bg-muted/50 p-4">
              <div className="h-6 bg-muted rounded-md w-1/2"></div>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-5 bg-muted rounded-md w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded-md w-full"></div>
                  <div className="h-4 bg-muted rounded-md w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoadmapDisplay() {
  const searchParams = useSearchParams();
  const career = searchParams.get("career");
  
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, Record<string, boolean>>>({});
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          const savedRoadmap = profile.savedRoadmaps?.find(r => r.career === career);
          setIsAlreadySaved(!!savedRoadmap);
          if (savedRoadmap?.completedMilestones) {
            setCompletedMilestones(savedRoadmap.completedMilestones);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [career]);

  useEffect(() => {
    if (!career) return;
    if (!userProfile) {
        if(user) setIsLoading(true); // Still waiting for profile
        return;
    };

    const fetchOrCreateRoadmap = async () => {
        setIsLoading(true);
        const savedRoadmap = userProfile.savedRoadmaps?.find(r => r.career === career);

        if (savedRoadmap) {
            setRoadmapData(savedRoadmap);
            if (savedRoadmap.completedMilestones) {
              setCompletedMilestones(savedRoadmap.completedMilestones);
            }
            setIsAlreadySaved(true);
        } else {
            try {
                const data = await generateRoadmap({
                    careerPath: career,
                    userProfile: `Skills: ${userProfile.skills}, Interests: ${userProfile.interests}, Education: ${userProfile.education}, Location: ${userProfile.location}`,
                });
                setRoadmapData({ ...data, career, createdAt: new Date().toISOString(), completedMilestones: {} });
                setIsAlreadySaved(false);
            } catch (err) {
                console.error(err);
                setError("Failed to generate your roadmap. Please try again later.");
            }
        }
        setIsLoading(false);
    };

    fetchOrCreateRoadmap();
  }, [career, userProfile, user]);

  const isStepUnlocked = (stepIndex: number, roadmap: any[], completed: Record<string, Record<string, boolean>>) => {
    if (stepIndex === 0) return true;
    const previousStepMilestones = roadmap[stepIndex - 1].milestones;
    const prevStepCompleted = completed[stepIndex - 1] || {};
    return previousStepMilestones.every((_: any, mIndex: number) => prevStepCompleted[mIndex]);
  };
  
  useEffect(() => {
    if (roadmapData) {
      // Logic to set default open accordion item, but we won't close others automatically
      if(openAccordionItems.length === 0){
        const firstUnlockedNotCompletedStep = roadmapData.roadmap.findIndex((step, index) => {
            const unlocked = isStepUnlocked(index, roadmapData.roadmap, completedMilestones);
            const stepCompleted = (step.milestones.length > 0) && step.milestones.every((_:any, mIndex:number) => completedMilestones[index]?.[mIndex]);
            return unlocked && !stepCompleted;
        });

        if (firstUnlockedNotCompletedStep !== -1) {
            setOpenAccordionItems([`item-${firstUnlockedNotCompletedStep}`]);
        } else if (roadmapData.roadmap.length > 0) {
            // If all are completed, open the first one
            setOpenAccordionItems(['item-0']);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapData, completedMilestones]);

  const handleSave = async () => {
    if (!user || !roadmapData || !career || !userProfile) {
      toast({ variant: "destructive", title: "Cannot save", description: "You must be logged in and have a roadmap generated." });
      return;
    }
    
    const savedRoadmaps = userProfile.savedRoadmaps || [];
    const existingRoadmapIndex = savedRoadmaps.findIndex((r: any) => r.career === career);

    // Check for save limit if user is not pro and is saving a new roadmap
    if (!userProfile.isProUser && savedRoadmaps.length >= 3 && existingRoadmapIndex === -1) {
        setShowUpgradeDialog(true);
        return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const newRoadmapData = { ...roadmapData, completedMilestones };

      if (existingRoadmapIndex > -1) {
        savedRoadmaps[existingRoadmapIndex] = newRoadmapData;
      } else {
        savedRoadmaps.push(newRoadmapData);
      }

      await setDoc(userDocRef, { savedRoadmaps: savedRoadmaps }, { merge: true });

      toast({
        title: isAlreadySaved ? "Progress Saved!" : "Roadmap Saved!",
        description: isAlreadySaved ? "Your milestone progress has been updated." : "This roadmap is now saved to your profile.",
      });
      setIsAlreadySaved(true);
    } catch (error) {
      console.error("Error saving roadmap: ", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was a problem saving. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckboxChange = (stepIndex: number, milestoneIndex: number, checked: boolean) => {
    setCompletedMilestones(prev => {
      const newCompleted = { ...prev };
      if (!newCompleted[stepIndex]) {
        newCompleted[stepIndex] = {};
      }
      newCompleted[stepIndex][milestoneIndex] = checked;
      return newCompleted;
    });
  };

  if (isLoading) {
    return <RoadmapSkeleton />;
  }

  if (error) {
    return <div className="text-destructive text-center p-8">{error}</div>;
  }
  
  if (!roadmapData || !career) {
    return <div className="text-muted-foreground text-center p-8">Select a career to generate a roadmap.</div>;
  }

  const allMilestonesCount = roadmapData.roadmap.reduce((acc, step) => acc + step.milestones.length, 0);
  const completedMilestonesCount = Object.values(completedMilestones).reduce((acc, step) => acc + Object.values(step).filter(Boolean).length, 0);
  const progressPercentage = allMilestonesCount > 0 ? (completedMilestonesCount / allMilestonesCount) * 100 : 0;
  
  return (
    <>
    <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Upgrade to Pro to Save More Roadmaps</AlertDialogTitle>
                <AlertDialogDescription>
                    You've reached your limit of 3 saved roadmaps on the free plan. Upgrade to Pro to save unlimited roadmaps and unlock all features.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <Link href="/settings">
                        <Crown className="mr-2"/>
                        Upgrade Now
                    </Link>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Roadmap: {career}</h1>
          <p className="text-muted-foreground">Track your progress towards becoming a {career}.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : (isAlreadySaved ? "Save Progress" : "Save Roadmap")}
        </Button>
      </header>

      {isAlreadySaved && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-4">
             <div className="w-full h-2.5 bg-secondary rounded-full">
                <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <p className="text-sm text-muted-foreground text-center ml-4 font-semibold">
                {Math.round(progressPercentage)}%
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full space-y-4">
          {roadmapData.roadmap.map((step, index) => {
            const unlocked = isStepUnlocked(index, roadmapData.roadmap, completedMilestones);
            return (
              <AccordionItem value={`item-${index}`} key={index} className="border-none">
                <Card className="overflow-hidden">
                  <AccordionTrigger className="w-full bg-muted/50 px-6 py-4 hover:no-underline data-[state=open]:border-b">
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="text-xl text-left">{`Step ${index + 1}: ${step.step}`}</CardTitle>
                      {unlocked ? <Unlock className="text-green-500" /> : <Lock className="text-red-500" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Milestones to Achieve</h3>
                        <ul className="space-y-3">
                          {step.milestones.map((milestone, mIndex) => {
                            const milestoneId = `m-${index}-${mIndex}`;
                            return (
                              <li key={mIndex} className="flex items-center gap-3">
                                <Checkbox 
                                  id={milestoneId}
                                  onCheckedChange={(checked) => handleCheckboxChange(index, mIndex, Boolean(checked))}
                                  checked={!!completedMilestones[index]?.[mIndex]}
                                  disabled={!unlocked}
                                />
                                <label htmlFor={milestoneId} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${unlocked ? 'cursor-pointer' : ''}`}>{milestone}</label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Skills to Acquire</h3>
                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill, sIndex) => (
                            <Badge key={sIndex} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4 md:col-span-2">
                         <h3 className="font-semibold">Recommended Resources</h3>
                         <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                           {step.resources.map((resource, rIndex) => (
                              <li key={rIndex}>
                                  <Link href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                      {resource.description}
                                  </Link>
                              </li>
                           ))}
                         </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
    </>
  );
}

export default function RoadmapPage() {
  return (
    <div className="p-4 md:p-8">
      <Suspense fallback={<RoadmapSkeleton />}>
        <RoadmapDisplay />
      </Suspense>
    </div>
  );
}
