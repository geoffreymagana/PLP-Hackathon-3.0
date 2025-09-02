"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const email = e.currentTarget.email.value;

        try {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
            toast({
                title: "Reset Email Sent",
                description: "Check your email for password reset instructions.",
            });
        } catch (error: any) {
            console.error("Password reset failed:", error);
            let description = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/user-not-found') {
                description = "No account found with this email address.";
            }
            toast({
                variant: "destructive",
                title: "Reset Failed",
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
                <CardDescription>
                    {emailSent 
                        ? "Check your email for reset instructions"
                        : "Enter your email address to reset your password"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {emailSent ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                A password reset link has been sent to your email address.
                                Click the link in the email to reset your password.
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => router.push('/login')}
                        >
                            Return to Login
                        </Button>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                placeholder="user@pathfinder.ai" 
                                required 
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-4">
                            <Button 
                                type="submit" 
                                className="w-full h-11 text-base"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Instructions
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/login')}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
