
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, CreditCard } from "lucide-react";
import { PaymentMethodSelector } from "@/components/ui/payment-method-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/min';
import 'libphonenumber-js/metadata.min.json';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const planDetails: Record<string, { name: string; price: number; currency: string; description: string }> = {
    "pro-monthly": { name: "Pro Plan (Monthly)", price: 200, currency: "KES", description: "Unlock all premium features with a monthly subscription." },
    "pro-annual": { name: "Pro Plan (Annual)", price: 3500, currency: "KES", description: "Get 2 months free with an annual subscription." },
    "one-off": { name: "One-Off Roadmap", price: 100, currency: "KES", description: "Purchase a single roadmap generation credit." },
};

const checkoutSchema = z.object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email(),
    countryCode: z.string().min(1, "Country is required"),
    phone: z.string().min(5, "A valid phone number is required."),
    paymentMethod: z.enum(["card", "mpesa", "bank", "airtel", "apple_pay"], { required_error: "Please select a payment method." }),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvc: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    swiftCode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'card') {
        if (!data.cardNumber || !/^\d{16}$/.test(data.cardNumber)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card number must be 16 digits.", path: ['cardNumber'] });
        }
        if (!data.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expiry must be MM/YY.", path: ['expiryDate'] });
        }
        if (!data.cvc || !/^\d{3}$/.test(data.cvc)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVC must be 3 digits.", path: ['cvc'] });
        }
    }
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type UserProfile = {
    location?: string;
    displayName?: string;
    email?: string;
};

function CheckoutPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const planId = searchParams.get('plan') || "pro-monthly";
    const plan = planDetails[planId];
    const career = searchParams.get('career');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const countries = getCountries();

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: "",
            email: "",
            countryCode: "",
            phone: "",
            paymentMethod: "card",
            cardNumber: "",
            expiryDate: "",
            cvc: "",
            bankName: "",
            accountNumber: "",
            swiftCode: "",
        },
    });

    const paymentMethod = form.watch('paymentMethod');
    const selectedCountryCode = form.watch('countryCode');
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                const profile = docSnap.exists() ? docSnap.data() as UserProfile : {};

                const userCountryCode = 'KE'; // Set Kenya as default country
                
                form.reset({
                    name: profile.displayName || user.displayName || "",
                    email: profile.email || user.email || "",
                    countryCode: userCountryCode,
                    paymentMethod: "card",
                });

                handlePhonePrefix(userCountryCode);

            } else {
                 router.push('/login');
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, router]);
    
    useEffect(() => {
        if (selectedCountryCode) {
            handlePhonePrefix(selectedCountryCode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCountryCode]);

    const handlePhonePrefix = (countryCode: string) => {
        try {
            const prefix = getCountryCallingCode(countryCode as any);
            form.setValue('phone', `+${prefix} `);
        } catch (e) {
            form.setValue('phone', '');
        }
    };

    const onSubmit = async (data: CheckoutFormValues) => {
        setIsSubmitting(true);
        toast({ title: "Processing Payment...", description: "Please wait while we initialize your transaction." });
        
        try {
            // Initialize Paystack transaction
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    amount: plan.price, // Convert to lowest currency unit (kobo/cents)
                    currency: plan.currency,
                    metadata: {
                        planId,
                        planName: plan.name,
                        career: career || undefined,
                        fullName: data.name,
                        phone: data.phone,
                    },
                }),
            });

            const result = await response.json();
            
            if (!result.authorization_url) {
                throw new Error(result.error || 'Failed to initialize payment');
            }

            // Redirect to Paystack checkout
            window.location.href = result.authorization_url;
        } catch (error) {
            console.error('Payment initialization failed:', error);
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: "Failed to initialize payment. Please try again.",
            });
            setIsSubmitting(false);
        }
    };
    
    if (!plan) {
        return (
             <div className="flex justify-center p-8">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle>Invalid Plan</CardTitle>
                        <CardDescription>The selected plan does not exist.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/pricing')}>Choose a Plan</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                 <div className="grid md:grid-cols-2 gap-8">
                     <Skeleton className="h-[500px] w-full" />
                     <Skeleton className="h-64 w-full" />
                 </div>
            </div>
        );
    }

    // Payment methods are now handled by the PaymentMethodSelector component

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="Secure Checkout"
                description={`You are purchasing: ${plan.name}`}
            />
            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>All transactions are secure and encrypted. This is a simulated payment form.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                            <FormLabel>Payment Method</FormLabel>
                                            <FormControl>
                                                <PaymentMethodSelector
                                                    value={field.value as any}
                                                    onValueChange={field.onChange}
                                                    availableMethods={['card', 'mpesa', 'bank', 'airtel', 'apple_pay']}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl><Input {...field} disabled /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input {...field} disabled /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="countryCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <Select onValueChange={(value) => { field.onChange(value); }} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a country" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {countries.map(country => (
                                                                <SelectItem key={country} value={country}>{country}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl><Input type="tel" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {paymentMethod === 'card' && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="cardNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Card Number</FormLabel>
                                                        <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="expiryDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Expiry Date</FormLabel>
                                                            <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cvc"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>CVC</FormLabel>
                                                            <FormControl><Input placeholder="123" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </>
                                    )}
                                    
                                    {paymentMethod === 'bank' && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="bankName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bank Name</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="accountNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Account Number</FormLabel>
                                                            <FormControl><Input {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="swiftCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Swift Code</FormLabel>
                                                            <FormControl><Input {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                        Pay KES {plan.price.toLocaleString()}
                                    </Button>
                                    
                                    <div className="flex justify-center mt-6">
                                        <img 
                                            className="max-w-full w-[420px] h-[130px]" 
                                            width="420" 
                                            height="130" 
                                            src="\images\paystack-badge-cards-kes-BdBpQwtR.svg" 
                                            alt="Secured by Paystack" 
                                        />
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{plan.name}</span>
                                <span>KES {plan.price.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between text-muted-foreground">
                                <span>Taxes & Fees</span>
                                <span>KES 0.00</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between font-bold border-t pt-4 mt-4">
                            <span>Total</span>
                            <span>KES {plan.price.toLocaleString()}</span>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
