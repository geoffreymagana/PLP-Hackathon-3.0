
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { RoadmapCard } from "@/components/roadmap-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type UserProfile = {
  savedRoadmaps?: any[];
};

export default function MyRoadmapsPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/3" />
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const savedRoadmaps = userProfile?.savedRoadmaps || [];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="space-y-2">
         <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2" />
            Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Saved Roadmaps</h1>
        <p className="text-muted-foreground">Here are all the career roadmaps you have saved.</p>
      </header>

      {savedRoadmaps.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRoadmaps.map((roadmap, index) => (
            <RoadmapCard key={index} roadmap={roadmap} showViewButton={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">You haven't saved any roadmaps yet.</h2>
            <p className="text-muted-foreground mt-2 mb-4">Explore careers and generate a roadmap to get started.</p>
            <Link href="/explore">
                <Button>Explore Careers</Button>
            </Link>
        </div>
      )}
    </div>
  );
}
