
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
import { Apple, Banknote, CreditCard, Loader2, Smartphone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/min';
import 'libphonenumber-js/metadata.min.json';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const planDetails: Record<string, { name: string; price: number; currency: string; description: string }> = {
    "pro-monthly": { name: "Pro Plan (Monthly)", price: 5, currency: "USD", description: "Unlock all premium features with a monthly subscription." },
    "pro-annual": { name: "Pro Plan (Annual)", price: 50, currency: "USD", description: "Get 2 months free with an annual subscription." },
    "one-off": { name: "One-Off Roadmap", price: 2, currency: "USD", description: "Purchase a single roadmap generation credit." },
};

const checkoutSchema = z.object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email(),
    countryCode: z.string().min(1, "Country is required"),
    phone: z.string().min(5, "A valid phone number is required."),
    paymentMethod: z.enum(["card", "mpesa", "bank", "airtel", "apple-pay"], { required_error: "Please select a payment method." }),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvc: z.string().optional(),
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

                const userCountryCode = countries.find(c => profile.location?.includes(c)) || 'NG';
                
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
        toast({ title: "Processing Payment...", description: "Please wait while we securely process your transaction." });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("Simulated payment success for:", data);

        const reference = `SIM_${Date.now()}`;
        const queryParams = new URLSearchParams({
            reference,
            planId: planId,
            planName: plan.name,
            amount: plan.price.toString(),
            currency: plan.currency,
        });

        if (planId === 'one-off' && career) {
            queryParams.append('career', career);
            queryParams.append('payment_status', 'success'); // Simulate success
            router.push(`/payment/complete?${queryParams.toString()}`);
        } else {
            router.push(`/payment/complete?${queryParams.toString()}`);
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

    const paymentMethods = [
        { id: "card", label: "Card", icon: CreditCard },
        { id: "mpesa", label: "MPesa", icon: Smartphone },
        { id: "bank", label: "Bank", icon: Banknote },
        { id: "airtel", label: "Airtel", icon: Smartphone },
        { id: "apple-pay", label: "Apple Pay", icon: Apple },
    ]

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
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                                    >
                                                    {paymentMethods.map(method => (
                                                        <FormItem key={method.id}>
                                                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                                            <Label htmlFor={method.id} className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", {'border-primary': paymentMethod === method.id})}>
                                                                <method.icon className="mb-3 h-6 w-6" />
                                                                {method.label}
                                                            </Label>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
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
                                    <FormDescription className="text-xs">
                                        This is a simulated payment form. No real transaction will be made.
                                    </FormDescription>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                        Pay {plan.price} {plan.currency}
                                    </Button>
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
                                <span>${plan.price.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-muted-foreground">
                                <span>Taxes & Fees</span>
                                <span>$0.00</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between font-bold border-t pt-4 mt-4">
                            <span>Total</span>
                            <span>${plan.price.toFixed(2)} {plan.currency}</span>
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
