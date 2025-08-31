"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Info, Loader2 } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


type UserProfile = {
  email?: string;
  displayName?: string;
};

const plans = {
  monthly: {
    name: "Pro Monthly",
    amount: 200,
    currency: "KES",
    description: "You will be charged KES 200.00 for a monthly subscription.",
    planCode: process.env.NEXT_PUBLIC_PAYSTACK_MONTHLY_PLAN_CODE || "",
  },
  annual: {
    name: "Pro Annually",
    amount: 3500,
    currency: "KES",
    description: "You will be charged KES 3,500.00 for a yearly subscription.",
    planCode: process.env.NEXT_PUBLIC_PAYSTACK_ANNUAL_PLAN_CODE || "",
  },
};

const proFeatures = [
    "Unlimited Roadmap Generations",
    "Unlimited Roadmap Saves",
    "Direct Mentor Connections",
    "Advanced Progress Analytics",
    "Priority Support"
];

const CheckoutSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
        </div>
    </div>
);

function TestCardInfo() {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Test Payment Information</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>Use the following card details to test the payment flow.</p>
                        <h4 className="font-semibold text-foreground">Successful Card</h4>
                        <p>Card Number: <code className="font-mono bg-muted p-1 rounded">4084 0840 8408 4081</code></p>
                        
                        <h4 className="font-semibold text-foreground">Failed Card (Declined)</h4>
                        <p>Card Number: <code className="font-mono bg-muted p-1 rounded">4084 0800 0000 5408</code></p>
                        
                        <p>Use any future date for expiry (e.g., 12/26) and any 3 digits for CVV (e.g., 123).</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const planParam = searchParams.get('plan');
  const plan: keyof typeof plans = (planParam && planParam in plans) ? planParam as keyof typeof plans : 'monthly';
  const selectedPlan = plans[plan];


  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const publishableKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  
  const config = {
    reference: (new Date()).getTime().toString(),
    email: userProfile?.email || "",
    amount: (selectedPlan?.amount || 0) * 100, // Amount is in kobo/cents
    publicKey: publishableKey,
    plan: selectedPlan?.planCode || "", // Pass plan code for subscription
    currency: selectedPlan?.currency || "KES",
  };

  const onSuccess = useCallback(async (reference: any) => {
    setIsProcessingPayment(true);
    if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        // Save transaction to a subcollection
        const transactionRef = collection(db, "users", auth.currentUser.uid, "transactions");
        await addDoc(transactionRef, {
            planName: selectedPlan.name,
            amount: selectedPlan.amount,
            currency: selectedPlan.currency,
            reference: reference.reference,
            status: reference.status,
            date: new Date().toISOString(),
        });
        
        // Update user to be a pro user
        await setDoc(userDocRef, { isProUser: true, subscriptionStatus: 'active' }, { merge: true });
        
        toast({
            title: "Upgrade Successful!",
            description: "Your subscription is now active.",
            variant: "default",
        });
        
        router.push("/settings"); // Redirect to settings to see new status and transaction
    }
    setIsProcessingPayment(false);
  }, [router, toast, selectedPlan]);

  const onClose = useCallback(() => {
    console.log("Paystack modal closed");
    setIsProcessingPayment(false);
  }, []);
  
  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
      if (!userProfile?.email) {
          toast({ variant: 'destructive', title: 'Error', description: 'User email not found.' });
          return;
      }
      if (!selectedPlan.planCode) {
          toast({ variant: 'destructive', title: 'Configuration Error', description: `Paystack plan code for the ${selectedPlan.name} plan is not set up.` });
          return;
      }
      setIsProcessingPayment(true);
      initializePayment({onSuccess, onClose});
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <CheckoutSkeleton />;
  }
  
  const isPaystackConfigured = publishableKey && selectedPlan.planCode;


  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Upgrade to Pro"
        description="Unlock your full potential with PathFinder AI Pro."
      />

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Pro Plan Features</CardTitle>
            <CardDescription>Everything you need to accelerate your career.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <ul className="space-y-3">
                {proFeatures.map(feature => (
                    <li key={feature} className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-1 rounded-full">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
             </ul>
          </CardContent>
        </Card>

         <Card className="sticky top-8">
            <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                 <p className="text-sm text-muted-foreground">
                    You have selected the <span className="font-bold text-primary">{selectedPlan?.name}</span> plan.
                 </p>
                 <p className="text-sm text-muted-foreground">{selectedPlan?.description}</p>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !isPaystackConfigured || !userProfile}
                    className="w-full h-12 rounded-md font-semibold transition-colors"
                >
                    {isProcessingPayment ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        "Proceed to Payment"
                    )}
                </Button>
                {!isPaystackConfigured && <p className="text-destructive text-sm text-center mt-2">Payment gateway is not configured correctly. Please contact support.</p>}
                 <div className="mt-6 flex flex-col items-center gap-4">
                    <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Paystack.png"
                        width={150} 
                        height={30}
                        alt="Secured by Paystack"
                        style={{ display: 'inline-block', height: 'auto', width: 'auto' }}
                        data-ai-hint="security badge"
                        priority
                    />
                    <TestCardInfo />
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutSkeleton />}>
            <CheckoutPageContent />
        </Suspense>
    );
}
