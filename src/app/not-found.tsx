
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
            <div className="max-w-md w-full">
                <h1 className="text-9xl font-bold text-primary tracking-tighter">404</h1>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Page Not Found</h2>
                <p className="mt-2 text-muted-foreground">
                    Oops! The page you are looking for does not exist. It might have been moved or deleted.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                     <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="mr-2" /> Go Back
                    </Button>
                    <Link href="/">
                        <Button>
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
