
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Terminal } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.02,35.136,44,30.024,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const email = e.currentTarget.email.value;
        const password = e.currentTarget.password.value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push('/?onboarding=true');
        } catch (error: any) {
            console.error("Signup failed:", error);
            let description = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                description = "This email is already registered. Please try logging in.";
            } else if (error.code === 'auth/weak-password') {
                description = "The password is too weak. Please use at least 6 characters.";
            }
             toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = () => {
        // Placeholder for Google Sign-in logic
        toast({
            title: "Coming Soon!",
            description: "Google Sign-in is not yet implemented.",
        });
    }

    return (
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
                <CardDescription>Join PathFinder AI to start your career journey</CardDescription>
            </CardHeader>
            <CardContent>
                {!isFirebaseConfigured ? (
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Firebase Not Configured</AlertTitle>
                        <AlertDescription>
                            Sign-up is currently disabled. Please add your Firebase configuration to the <code>.env</code> file to enable user registration.
                        </AlertDescription>
                    </Alert>
                ) : (
                <>
                    <form className="space-y-4" onSubmit={handleSignup}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="user@pathfinder.ai" required />
                        </div>
                        <div className="space-y-2 relative">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type={showPassword ? "text" : "password"} required />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-7 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="terms" required/>
                            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                                I agree to the{' '}
                                <Link href="/terms" className="font-medium text-primary hover:underline">
                                    Terms of Use
                                </Link>
                            </Label>
                        </div>
                        <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                    <div className="my-6 flex items-center">
                        <Separator className="flex-1" />
                        <span className="px-4 text-sm text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>
                    <Button onClick={handleGoogleLogin} className="w-full h-12 text-base" variant="outline">
                        <GoogleIcon className="mr-3" />
                        Sign up with Google
                    </Button>
                </>
                )}
                <div className="mt-6 text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
