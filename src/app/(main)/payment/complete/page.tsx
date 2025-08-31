
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { sendPaymentNotification } from "@/services/notification-service";

type VerificationStatus = "verifying" | "success" | "failed";

// This is a client-side mock. In a real app, this should be a server-side function.
async function verifyPaystackTransaction(reference: string): Promise<boolean> {
  // For MVP purposes, we'll simulate a successful verification if a reference exists.
  // In a production environment, you MUST call the Paystack verification endpoint from your backend
  // to prevent users from fraudulently claiming payments.
  console.log(`Simulating verification for reference: ${reference}`);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  return !!reference;
}

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<VerificationStatus>("verifying");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    const processPayment = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to complete a payment.",
        });
        setStatus("failed");
        return;
      }

      const isVerified = await verifyPaystackTransaction(reference);

      if (isVerified) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const transactionRef = collection(db, "users", user.uid, "transactions");

          // For simplicity, we assume any verified payment is for the Pro plan.
          // A real app would need more sophisticated logic to determine the plan.
          const planName = "Pro Plan";

          await addDoc(transactionRef, {
            planName: planName,
            reference: reference,
            status: "success",
            date: serverTimestamp(),
          });

          await setDoc(userDocRef, { isProUser: true, subscriptionStatus: 'active' }, { merge: true });
          
          await sendPaymentNotification(planName);

          toast({
            title: "Upgrade Successful!",
            description: "Your Pro subscription is now active.",
          });
          setStatus("success");
        } catch (error) {
          console.error("Error updating user profile:", error);
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Your payment was successful, but we couldn't update your profile. Please contact support.",
          });
          setStatus("failed");
        }
      } else {
        setStatus("failed");
      }
    };

    processPayment();
  }, [reference, router, toast]);

  return (
    <div className="flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Your Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          <CardDescription>
             {status === 'verifying' && 'Please wait while we confirm your transaction...'}
             {status === 'success' && "Welcome to Pro! You've unlocked all premium features."}
             {status === 'failed' && 'There was a problem with your payment. Please try again or contact support.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-10">
          {status === 'verifying' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
          {status === 'failed' && <XCircle className="h-16 w-16 text-destructive" />}

          <div className="w-full">
            {status === 'success' && (
                <Link href="/settings">
                    <Button className="w-full">Go to My Settings</Button>
                </Link>
            )}
            {status === 'failed' && (
                <Link href="/pricing">
                    <Button className="w-full" variant="destructive">Try Again</Button>
                </Link>
            )}
             </div>
             <Link href="/">
                <Button variant="link">Back to Dashboard</Button>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}


export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCompleteContent />
    </Suspense>
  );
}
