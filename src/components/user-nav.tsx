
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import { doc, getDoc, setDoc } from "firebase/firestore";

type UserProfileData = {
    displayName?: string;
    email?: string;
    avatarUrl?: string;
};

export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

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
                    displayName: data.displayName || user.displayName || user.email,
                    email: user.email || '',
                    avatarUrl: avatarUrl
                });
            } else {
                 // This case is for users who exist in Auth but not in Firestore (e.g., right after signup)
                const avatarUrl = user.photoURL || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.email}`;
                setUserProfile({
                    displayName: user.displayName || user.email,
                    email: user.email || '',
                    avatarUrl: avatarUrl
                })
            }
        } else {
            setUserProfile(null);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
}, []);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  const handleProfile = () => {
    router.push("/profile");
  };
  
  const handleSettings = () => {
    router.push("/settings");
  };

  if (isLoading) {
    if (isMobile) {
        return <Skeleton className="h-10 w-10 rounded-full" />
    }
    return <Skeleton className="h-12 w-full" />;
  }

  if (!userProfile) {
    return null;
  }
  
  if (isMobile) {
    return (
       <Link href="/profile" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted group text-muted-foreground hover:text-primary h-full w-full">
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
       </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-full justify-start gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile.avatarUrl} alt="User avatar" />
            <AvatarFallback>{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate">
            <span className="text-sm font-medium truncate">{userProfile.displayName}</span>
            <span className="text-xs text-muted-foreground truncate">
              {userProfile.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
