
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";

const OnboardingIllustration = () => (
    <div className="relative w-full h-64">
        {/* Background shapes */}
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/20 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-accent/20 rounded-full opacity-50 translate-x-1/2 translate-y-1/4"></div>
        
        {/* Foreground path illustration */}
        <svg viewBox="0 0 300 150" className="absolute inset-0 w-full h-full">
            <path d="M 20 130 Q 80 80, 150 90 T 280 20" stroke="hsl(var(--foreground))" fill="none" strokeWidth="2" strokeDasharray="5,5" />
            
            {/* Waypoints */}
            <circle cx="20" cy="130" r="5" fill="hsl(var(--primary))" />
            <rect x="145" y="85" width="10" height="10" rx="2" fill="hsl(var(--primary))" transform="rotate(45 150 90)" />
            <circle cx="280" cy="20" r="5" fill="hsl(var(--accent))" />

            {/* Decorative elements */}
            <circle cx="50" cy="40" r="3" fill="hsl(var(--muted-foreground))" />
            <circle cx="250" cy="110" r="4" fill="hsl(var(--muted-foreground))" />
            <rect x="200" y="50" width="8" height="8" rx="2" fill="hsl(var(--accent))" transform="rotate(-30 204 54)" />

        </svg>
    </div>
);

const formSchema = z.object({
  displayName: z.string().min(2, "Please enter your name."),
  skills: z.string().min(2, "Please enter at least one skill."),
  interests: z.string().min(2, "Please enter at least one interest."),
  education: z.string().min(2, "Please enter your education level."),
  location: z.string().min(2, "Please enter your location."),
});

type OnboardingData = z.infer<typeof formSchema>;

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
    <div className="flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-md w-full space-y-8">
            <OnboardingIllustration />

            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Your Career Journey Starts Here
                </h1>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    We provide AI-powered guidance to help you navigate the African job market and find your ideal career path.
                </p>
            </div>
            
            <Button onClick={onNext} size="lg" className="w-full max-w-xs mx-auto">
                Get Started
                <ArrowRight className="ml-2" />
            </Button>
        </div>
    </div>
);

const ProfileStep = ({ onBack, onFinish }: { onBack: () => void, onFinish: (values: OnboardingData) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<OnboardingData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      skills: "",
      interests: "",
      education: "",
      location: "",
    },
  });

  const handleSubmit = async (values: OnboardingData) => {
    setIsLoading(true);
    
    if (!isFirebaseConfigured) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Cannot save profile. Please configure Firebase first.",
        });
        setIsLoading(false);
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "No authenticated user found. Please sign in again.",
        });
        setIsLoading(false);
        return;
    }

    try {
        const avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.email}`;
        
        // Update Firebase Auth Profile
        await updateProfile(user, {
            displayName: values.displayName,
            photoURL: avatarUrl
        });

        // Save data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            displayName: values.displayName,
            skills: values.skills,
            interests: values.interests,
            education: values.education,
            location: values.location,
            avatarUrl: avatarUrl,
        });

        toast({
            title: "Profile Saved!",
            description: "Your information has been saved successfully.",
        });
        onFinish(values);
    } catch (error) {
        console.error("Failed to save profile:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save your profile. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full">
        <Card>
            <CardHeader>
                <CardTitle>Tell Us About Yourself</CardTitle>
                <CardDescription>This information helps us personalize your career suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Ada Lovelace" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Lagos, Nigeria" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., JavaScript, Project Management, Graphic Design" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="interests"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Interests</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Technology, Art, Healthcare, FinTech" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="education"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Highest Education Level</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Bachelor's Degree in Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Button type="button" variant="outline" onClick={onBack}>
                                <ArrowLeft className="mr-2" />
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading || !isFirebaseConfigured}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Finish
                                <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
};


export function Onboarding({ onOnboardingComplete }: { onOnboardingComplete: () => void }) {
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            {step === 1 && <WelcomeStep onNext={nextStep} />}
            {step === 2 && <ProfileStep onBack={prevStep} onFinish={onOnboardingComplete} />}
        </div>
    );
}
