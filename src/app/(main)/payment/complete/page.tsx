
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, arrayUnion, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { sendPaymentNotification } from "@/services/notification-service";
import { generateRoadmap } from "@/ai/flows/roadmap-generation";

type VerificationStatus = "verifying" | "success" | "failed" | "already_processed";
type UserProfile = {
  skills: string;
  interests: string;
  education: string;
  location: string;
};


// Import the verification function from our Paystack lib
import { verifyPaystackTransaction } from '@/lib/paystack';

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const reference = searchParams.get('reference');
  const planId = searchParams.get('planId');
  const planName = searchParams.get('planName');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');
  const career = searchParams.get('career');

  const [status, setStatus] = useState<VerificationStatus>("verifying");

  useEffect(() => {
    const processPayment = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to complete a payment.",
        });
        setStatus("failed");
        router.push('/login');
        return;
      }
      
      if (!reference || !planId || !planName || !amount || !currency) {
          toast({ variant: "destructive", title: "Invalid Payment URL", description: "Missing payment details." });
          setStatus("failed");
          return;
      }
      
      // --- IDEMPOTENCY CHECK ---
      // Check if this transaction reference has already been processed.
      const transactionsRef = collection(db, "users", user.uid, "transactions");
      const q = query(transactionsRef, where("reference", "==", reference));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({ title: "Already Processed", description: "This payment has already been recorded." });
        setStatus("already_processed");
        return;
      }

      // In a real app, you might have a different verification logic for simulated payments
      const isVerified = searchParams.get('payment_status') === 'success' || await verifyPaystackTransaction(reference);

      if (isVerified) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const transactionRef = collection(db, "users", user.uid, "transactions");

          // Double-check no transaction exists with this reference before proceeding
          const existingTxQuery = query(transactionRef, where("reference", "==", reference));
          const existingTx = await getDocs(existingTxQuery);
          if (!existingTx.empty) {
            toast({ title: "Already Processed", description: "This payment has already been recorded." });
            setStatus("already_processed");
            return;
          }

          // Record the transaction
          await addDoc(transactionRef, {
            planName,
            planId,
            amount: parseFloat(amount),
            currency,
            reference: reference,
            status: "success",
            date: serverTimestamp(),
          });
          
          await sendPaymentNotification(planName);

          // Update user profile based on plan
          if (planId.startsWith('pro')) {
            const now = new Date();
            const subscriptionEndDate = planId === 'pro-monthly' 
              ? new Date(now.setMonth(now.getMonth() + 1)) // 1 month from now
              : new Date(now.setFullYear(now.getFullYear() + 1)); // 1 year from now

            await setDoc(userDocRef, { 
              isProUser: true, 
              subscriptionStatus: 'active', 
              subscriptionPlan: planId,
              subscriptionEndDate: subscriptionEndDate.toISOString(),
            }, { merge: true });
             toast({
              title: "Upgrade Successful!",
              description: `Your ${planName} subscription is now active.`,
            });
          } else if (planId === 'one-off' && career) {
             const userDoc = await getDoc(userDocRef);
             const userProfile = userDoc.data() as UserProfile;

             // Generate and save the new roadmap
             const newRoadmapData = await generateRoadmap({
                careerPath: career,
                userProfile: `Skills: ${userProfile.skills}, Interests: ${userProfile.interests}, Education: ${userProfile.education}, Location: ${userProfile.location}`,
             });

             const roadmapToSave = {
                ...newRoadmapData,
                career,
                createdAt: new Date().toISOString(),
                completedMilestones: {}
             };

             await setDoc(userDocRef, { 
                savedRoadmaps: arrayUnion(roadmapToSave)
             }, { merge: true });
             
             toast({
              title: "Purchase Successful!",
              description: `Your new roadmap for ${career} has been saved.`,
            });
             router.push(`/roadmap?career=${encodeURIComponent(career)}`);
             return; // End execution here to prevent showing the generic success page
          }

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
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "We could not verify your payment. Please try again or contact support if the issue persists.",
        });
        setStatus("failed");
      }
    };

    processPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render anything if we're processing a one-off purchase that hasn't failed
  if (planId === 'one-off' && career && status !== 'failed') {
      // If it was already processed, just redirect them to the result.
      if (status === 'already_processed') {
          router.push(`/roadmap?career=${encodeURIComponent(career)}`);
          return null;
      }
      return (
        <div className="flex items-center justify-center p-4 md:p-8 min-h-screen">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Processing Your Purchase</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 p-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Please wait while we generate and save your new roadmap...</p>
            </CardContent>
          </Card>
        </div>
      );
  }

  const getStatusContent = () => {
    switch(status) {
        case 'verifying':
            return { title: 'Verifying Your Payment', description: 'Please wait while we confirm your transaction...' };
        case 'success':
            return { title: 'Payment Successful!', description: "Welcome to Pro! You've unlocked all premium features." };
        case 'failed':
            return { title: 'Payment Failed', description: 'There was a problem with your payment. Please try again or contact support.' };
        case 'already_processed':
             return { title: 'Payment Already Processed', description: 'This transaction has already been completed.' };
        default:
            return { title: 'Payment Status', description: ''};
    }
  }

  const { title, description } = getStatusContent();

  return (
    <div className="flex items-center justify-center p-4 md:p-8 min-h-screen">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-10">
          {status === 'verifying' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
          {(status === 'success' || status === 'already_processed') && <CheckCircle className="h-16 w-16 text-green-500" />}
          {status === 'failed' && <XCircle className="h-16 w-16 text-destructive" />}

          <div className="w-full">
            {(status === 'success' || status === 'already_processed') && (
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>}>
      <PaymentCompleteContent />
    </Suspense>
  );
}
