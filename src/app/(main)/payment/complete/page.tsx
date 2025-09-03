
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

type VerificationStatus = "verifying" | "success" | "failed" | "already_processed" | "error";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setErrorMessage("Invalid payment URL: Missing transaction reference.");
      setStatus("error");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is authenticated, proceed with payment verification.
        await processPayment(user.uid);
      } else {
        // Wait a bit for auth state to propagate. If still no user, then fail.
        setTimeout(async () => {
          if (!auth.currentUser) {
            setErrorMessage("Authentication error. Please log in and try again.");
            setStatus("error");
            router.push('/login');
          } else {
            await processPayment(auth.currentUser.uid);
          }
        }, 2500); // Wait for 2.5 seconds
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);


  const processPayment = async (userId: string) => {
    if (!planId || !planName || !amount || !currency) {
      setErrorMessage("Invalid payment URL: Missing payment details.");
      setStatus("error");
      return;
    }
    
    // --- IDEMPOTENCY CHECK ---
    const transactionsRef = collection(db, "users", userId, "transactions");
    const q = query(transactionsRef, where("reference", "==", reference));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toast({ title: "Already Processed", description: "This payment has already been recorded." });
      setStatus("already_processed");
      return;
    }

    const verificationResult = await verifyPaystackTransaction(reference as string);
    
    // Check if verification was successful and transaction status is success
    if (verificationResult.success && verificationResult.data.status === 'success') {
      try {
        const userDocRef = doc(db, "users", userId);
        
        // Record the transaction
        await addDoc(transactionsRef, {
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
          setStatus("success");

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
          // Redirect immediately for one-off purchase
          router.push(`/my-roadmaps`);
          return;
        } else {
          setStatus("success");
        }
        
      } catch (error) {
        console.error("Error updating user profile:", error);
        setErrorMessage("Your payment was successful, but we couldn't update your profile. Please contact support.");
        setStatus("failed");
      }
    } else {
        setErrorMessage(verificationResult.data?.gateway_response || "We could not verify your payment. Please contact support if payment was debited.");
        setStatus("failed");
    }
  };

  // Don't render anything if we're processing a one-off purchase that hasn't failed
  if (planId === 'one-off' && career && status === 'verifying') {
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
            return { title: 'Payment Failed', description: errorMessage || 'There was a problem with your payment. Please try again or contact support.' };
        case 'error':
             return { title: 'An Error Occurred', description: errorMessage || 'An unexpected error occurred.' };
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
          {(status === 'failed' || status === 'error') && <XCircle className="h-16 w-16 text-destructive" />}

          <div className="w-full">
            {(status === 'success' || status === 'already_processed') && (
                <Link href="/settings">
                    <Button className="w-full">Go to My Settings</Button>
                </Link>
            )}
            {(status === 'failed' || status === 'error') && (
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

