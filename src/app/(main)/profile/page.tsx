"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfileData = {
    displayName?: string;
    email?: string;
    education?: string;
    skills?: string;
    interests?: string;
    location?: string;
    avatarUrl?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                let avatarUrl = data.avatarUrl;

                // If avatarUrl is missing, generate, save, and use it
                if (!avatarUrl) {
                    avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.email}`;
                     try {
                        await setDoc(docRef, { avatarUrl: avatarUrl }, { merge: true });
                    } catch (error) {
                        console.error("Failed to save new avatar for existing user:", error);
                    }
                }

                setUserProfile({
                    displayName: data.displayName || user.displayName || data.email,
                    email: user.email || '',
                    avatarUrl: avatarUrl,
                    ...data
                });
            } else {
                 router.push('/?onboarding=true');
            }
        } else {
            router.push('/login');
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };
  
  const handleSettings = () => {
    router.push('/settings');
  }
  
  if (isLoading) {
    return (
       <div className="p-4 md:p-8 space-y-8">
            <header className="space-y-2">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </header>
             <Card className="max-w-2xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-3">
                       <Skeleton className="h-5 w-24" />
                       <Skeleton className="h-5 w-1/2" />
                   </div>
                   <div className="space-y-3">
                       <Skeleton className="h-5 w-24" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                             <Skeleton className="h-6 w-28 rounded-full" />
                        </div>
                   </div>
                   <div className="space-y-3">
                       <Skeleton className="h-5 w-24" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-28 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                   </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (!userProfile) {
    return null; // Or a message indicating profile not found
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">This is the information used by the AI to generate your career path.</p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={userProfile.avatarUrl} alt="User avatar" />
            <AvatarFallback>{userProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{userProfile.displayName}</CardTitle>
            <CardDescription>{userProfile.location}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Education</h3>
            <p className="text-muted-foreground">{userProfile.education}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.skills?.split(',').map((skill, i) => <Badge key={i} variant="secondary">{skill.trim()}</Badge>)}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.interests?.split(',').map((interest, i) => <Badge key={i} variant="secondary">{interest.trim()}</Badge>)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
           <Button onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
