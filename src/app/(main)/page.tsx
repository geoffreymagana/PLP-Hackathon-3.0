
"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { personalizedCareerSuggestions, type PersonalizedCareerSuggestionsOutput } from "@/ai/flows/personalized-career-suggestions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { DashboardCards } from "@/components/dashboard-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { RoadmapCard } from "@/components/roadmap-card";

const loadingTexts = [
    "Analyzing your profile...",
    "Scanning the learning landscape...",
    "Identifying top learning paths...",
    "Finalizing your suggestions...",
];

type UserProfile = {
  skills: string;
  interests: string;
  education: string;
  location: string;
  email?: string;
  savedRoadmaps?: any[];
};

const SuggestionsContainer = ({ suggestions }: { suggestions: PersonalizedCareerSuggestionsOutput }) => (
  <div id="suggestions" className="space-y-4 pt-8">
    <h2 className="text-2xl font-bold tracking-tight font-headline">Learning Path Suggestions</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {suggestions.careers.map((career) => (
        <Card key={career.title} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>{career.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">{career.description}</p>
            <div>
              <h4 className="text-sm font-semibold">Salary Range</h4>
              <p className="text-sm text-muted-foreground">{career.salaryRange}</p>
            </div>
              <div>
              <h4 className="text-sm font-semibold">African Market Demand</h4>
              <p className="text-sm text-muted-foreground">{career.africanJobMarketDemand}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`} passHref className="w-full">
              <Button className="w-full">
                Generate Roadmap
                <ArrowRight className="ml-2"/>
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);

const LoadingState = ({ progress, text }: { progress: number, text: string }) => (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
        <div className="relative h-24 w-24 mb-4">
            <Loader2 className="absolute inset-0 h-full w-full animate-spin text-primary" />
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
                {Math.round(progress)}%
            </div>
        </div>
        <p className="text-muted-foreground font-medium mb-4">{text}</p>
        <Progress value={progress} className="w-full max-w-md" />
    </Card>
);

const DiscoverPotentialCard = ({ userProfile, onGenerate, onDismiss }: { userProfile: UserProfile, onGenerate: () => void, onDismiss: () => void }) => (
    <Card className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-2xl">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={onDismiss}>
            <X className="h-5 w-5" />
            <span className="sr-only">Dismiss</span>
        </Button>
        <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-3"><Wand2 />Discover Your Learning Path</CardTitle>
            <CardDescription className="text-primary-foreground/80">
                Leverage our AI to generate personalized learning roadmaps based on your unique profile.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm">Click the button below to start the process. We'll use your profile information to find the best learning journeys for you.</p>
        </CardContent>
        <CardFooter>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="secondary" size="lg" className="text-base">
                        <Sparkles className="mr-2" />
                        Generate Suggestions
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Your Profile</AlertDialogTitle>
                        <AlertDialogDescription>
                            We will use the following information to generate your learning suggestions. Please confirm it is correct.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="text-sm space-y-3 rounded-md border p-4 bg-muted/50">
                        <p><strong>Skills:</strong> {userProfile.skills}</p>
                        <p><strong>Interests:</strong> {userProfile.interests}</p>
                        <p><strong>Education:</strong> {userProfile.education}</p>
                        <p><strong>Location:</strong> {userProfile.location}</p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onGenerate}>Confirm & Generate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);

const SavedRoadmapsPreview = ({ roadmaps }: { roadmaps: any[] }) => (
    <div>
        <h2 className="text-2xl font-bold tracking-tight font-headline mb-4">My Saved Roadmaps</h2>
        {roadmaps && roadmaps.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roadmaps.map((roadmap, index) => (
                    <RoadmapCard key={index} roadmap={roadmap} />
                ))}
            </div>
        ) : (
            <Card className="border-dashed flex flex-col items-center justify-center text-center p-12 hover:border-primary hover:text-primary transition-colors">
                <Link href="/explore" passHref className="w-full h-full">
                    <CardTitle className="text-lg">No roadmaps saved yet.</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Explore learning paths and generate a roadmap to get started.
                    </p>
                </Link>
            </Card>
        )}
    </div>
);

function DashboardView() {
  const router = useRouter();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<PersonalizedCareerSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(loadingTexts[0]);
  const [isBannerVisible, setIsBannerVisible] = useState(true);


  useEffect(() => {
    if (!isFirebaseConfigured) {
        setIsProfileLoading(false);
        // Maybe show a banner to the user to configure Firebase
        return;
    }
    const fetchUserProfile = async (user: any) => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
      } else {
        router.push('/onboarding');
      }
      setIsProfileLoading(false);
    };
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserProfile(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingProgress(0);
      setLoadingText(loadingTexts[0]);
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
            const newProgress = prev + 1;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            if (newProgress > 25 && newProgress < 50) setLoadingText(loadingTexts[1]);
            else if (newProgress > 50 && newProgress < 75) setLoadingText(loadingTexts[2]);
            else if (newProgress > 75) setLoadingText(loadingTexts[3]);
            return newProgress;
        });
      }, 80); // Simulate progress
      return () => clearInterval(progressInterval);
    }
  }, [isLoading]);
  
  const handleGenerateSuggestions = async () => {
    if (!userProfile) {
        toast({
            variant: "destructive",
            title: "Profile not found",
            description: "Please complete your profile first.",
        });
        return;
    }
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await personalizedCareerSuggestions(userProfile);
      setSuggestions(result);
      router.push('/#suggestions');
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with the AI suggestion. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isProfileLoading) {
    return (
        <main className="flex-1 p-4 md:p-8 space-y-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-6 pt-6">
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </main>
    );
  }
  
  const showDiscoverCard = userProfile && isBannerVisible;

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your personalized learning command center.
        </p>
      </header>

      <div className="space-y-8">
        {showDiscoverCard && userProfile && (
          <DiscoverPotentialCard 
            userProfile={userProfile} 
            onGenerate={handleGenerateSuggestions}
            onDismiss={() => setIsBannerVisible(false)}
          />
        )}
        
        {isLoading && (
            <LoadingState progress={loadingProgress} text={loadingText} />
        )}
        
        {suggestions && !isLoading && (
          <SuggestionsContainer suggestions={suggestions} />
        )}

        <DashboardCards />

        {userProfile && <SavedRoadmapsPreview roadmaps={userProfile.savedRoadmaps || []} />}

      </div>

    </main>
  );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardView />
        </Suspense>
    );
}
