
"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
      <div className="max-w-md w-full">
        <h1 className="text-7xl font-bold text-destructive tracking-tighter">500</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-muted-foreground">
          We're sorry, but an unexpected server error occurred. Please try again.
        </p>
        <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => reset()} variant="outline">
                Try Again
            </Button>
            <Link href="/">
                <Button>
                    <ArrowLeft className="mr-2" />
                    Return to Dashboard
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
