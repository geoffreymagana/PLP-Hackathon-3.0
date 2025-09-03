
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, ChevronRight, Crown, Loader2, Bell, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BillingHistory } from "@/components/billing-history";

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be less than 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type UserProfile = {
    isProUser?: boolean;
    language?: string;
    displayName?: string;
};

const SettingsListItem = ({ children, href }: { children: React.ReactNode, href?: string }) => {
    const content = (
        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-md">
            {children}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="-m-4">
                {content}
            </Link>
        );
    }
    return content;
};

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  useEffect(() => {
    // This effect runs only on the client
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUserProfile(userData);
          form.reset({
            displayName: userData.displayName || user.displayName || "",
          });
        }
      }
      setIsPageLoading(false);
    });
    return () => unsubscribe();
  }, [form]);


  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to update your profile.",
      });
      setIsLoading(false);
      return;
    }

    try {
      await updateProfile(user, {
        displayName: data.displayName,
      });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { displayName: data.displayName }, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your display name has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setUserProfile(prev => prev ? { ...prev, language: newLanguage } : { language: newLanguage });
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { language: newLanguage }, { merge: true });
      toast({
        title: "Language Preference Saved",
        description: `Your language has been set. Full translations coming soon!`,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    }
  };
  
  const handlePushToggle = async (checked: boolean) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'This browser does not support push notifications.' });
        return;
    }

    if (checked) {
        // Subscribe logic
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            await subscribeUser();
        } else {
             toast({ variant: 'destructive', title: 'Permission Not Granted', description: 'You have not enabled push notifications.' });
        }
    } else {
        // Unsubscribe logic
        await unsubscribeUser();
    }
  };

  const subscribeUser = async () => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: 'VAPID key is not configured.' });
        console.error('VAPID public key not found.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey,
        });
        
        console.log('Push Subscription:', JSON.stringify(subscription));
        setIsSubscribed(true);
        toast({ title: 'Subscribed!', description: 'You will now receive push notifications.' });

    } catch (error) {
        console.error('Failed to subscribe:', error);
        setIsSubscribed(false);
        setNotificationPermission('default');
        toast({ variant: 'destructive', title: 'Subscription Failed', description: 'Could not subscribe to push notifications.' });
    }
  };

  const unsubscribeUser = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            // In a real app, you would also notify your backend to remove the subscription.
            setIsSubscribed(false);
            toast({ title: 'Unsubscribed', description: 'You will no longer receive push notifications.' });
        }
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        toast({ variant: 'destructive', title: 'Unsubscribe Failed', description: 'Could not unsubscribe.' });
    }
  };
  
   const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast({ variant: 'destructive', title: 'Not Subscribed', description: 'Please enable push notifications first.' });
      return;
    }
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('PathFinder AI Test', {
        body: 'This is a test notification! Click to open the app.',
        icon: '/icons/icon-192x192.png',
        data: { url: window.location.origin }, // Pass the base URL
        tag: 'test-notification'
      });
    });
  };


  if (isPageLoading) {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings, preferences, and more."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                    Update your account details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                    Customize your experience to fit your needs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="language-select">Language</Label>
                    <Select value={userProfile?.language || 'en'} onValueChange={handleLanguageChange}>
                        <SelectTrigger id="language-select" className="w-full md:w-1/2">
                        <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français (French)</SelectItem>
                        <SelectItem value="sw">Kiswahili (Swahili)</SelectItem>
                        <SelectItem value="yo">Yorùbá</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                    <div>
                        <h4 className="font-medium">Notifications</h4>
                        <p className="text-sm text-muted-foreground">Choose how you receive updates.</p>
                        </div>
                    <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                        <Label htmlFor="email-notifications" className="font-normal">
                        Email Notifications
                        </Label>
                        <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                        <Label htmlFor="push-notifications" className="font-normal">
                        Push Notifications
                        </Label>
                        <Switch 
                            id="push-notifications" 
                            checked={isSubscribed}
                            onCheckedChange={handlePushToggle}
                            disabled={notificationPermission === 'denied'}
                        />
                    </div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button
                        variant="secondary"
                        onClick={handleTestNotification}
                        disabled={!isSubscribed}
                    >
                        <Bell className="mr-2"/>
                        Test Notification
                    </Button>
                </CardFooter>
            </Card>
            <BillingHistory />
        </div>

        <div className="col-span-1 space-y-8">
            <Card className={cn(userProfile?.isProUser && "border-primary")}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Subscription</CardTitle>
                            <CardDescription>
                                Manage your plan.
                            </CardDescription>
                        </div>
                        {userProfile?.isProUser && <Crown className="text-primary"/>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Card className={cn("p-4", userProfile?.isProUser ? "bg-primary/10 border-primary/50" : "bg-muted/70")}>
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Current Plan</p>
                            <p className={cn("font-bold text-lg", userProfile?.isProUser && "text-primary")}>
                                {userProfile?.isProUser ? "Pro" : "Basic"}
                            </p>
                        </div>
                        {userProfile?.isProUser && <p className="text-xs text-muted-foreground">You have access to all features!</p>}
                    </Card>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center"><Check className="mr-2 text-green-500"/> Unlimited AI-Generated Roadmaps</li>
                        <li className="flex items-center"><Check className="mr-2 text-green-500"/> Advanced Learning Analytics</li>
                        <li className="flex items-center"><Check className="mr-2 text-green-500"/> Access to Verified Mentors</li>
                        <li className="flex items-center"><Check className="mr-2 text-green-500"/> Priority Support</li>
                    </ul>
                    {!userProfile?.isProUser && (
                         <Link href="/pricing" className="w-full">
                            <Button className="w-full">
                                <Crown className="mr-2"/>
                                View Upgrade Plans
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>
                Find answers to your questions.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    <SettingsListItem href="/about">
                        <span className="font-medium">About Us</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </SettingsListItem>
                    <SettingsListItem href="/faq">
                        <span className="font-medium">FAQ</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </SettingsListItem>
                    <SettingsListItem href="/contact">
                        <span className="font-medium">Contact Support</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </SettingsListItem>
                    <SettingsListItem href="/feedback">
                        <span className="font-medium">Submit Feedback</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </SettingsListItem>
                </div>
            </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Mentorship & Communities</CardTitle>
                    <CardDescription>
                    Connect with peers, mentors, and industry experts across Africa.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link href="/connect?tab=communities" className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <h4 className="font-semibold">Join a Community</h4>
                        <p className="text-sm text-muted-foreground">Engage in discussions, share progress, and find collaborators.</p>
                    </Link>
                    <Link href="/connect?tab=mentors" className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <h4 className="font-semibold">Find a Mentor</h4>
                        <p className="text-sm text-muted-foreground">Get one-on-one guidance from experienced professionals.</p>
                    </Link>
                    <Link href="/become-mentor" className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Become a Mentor</h4>
                            <div className="p-1.5 bg-primary/10 rounded-full">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Share your expertise and guide the next generation of talent.</p>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    