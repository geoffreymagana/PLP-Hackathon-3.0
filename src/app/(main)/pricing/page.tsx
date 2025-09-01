
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const tiers = [
  {
    name: "Basic",
    planId: "basic",
    price: "Free",
    priceDetails: "Forever",
    features: [
      "3 Free AI-Generated Roadmaps",
      "Access to Open-Source Learning Resources",
      "Community Access (Unverified)",
      "Basic Progress Tracking",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    href: "/",
    isFeatured: false,
    disabled: true,
  },
  {
    name: "Pro Monthly",
    planId: "pro-monthly",
    price: "KES 200",
    priceDetails: "per month",
    features: [
      "Everything in Basic, plus:",
      "Unlimited AI-Generated Roadmaps",
      "Advanced Learning Analytics",
      "Access to Verified Mentors",
      "Priority Roadmap Updates",
      "Priority Support",
    ],
    buttonText: "Upgrade to Monthly",
    buttonVariant: "default",
    href: "/checkout?plan=pro-monthly", 
    isFeatured: true,
    disabled: false,
  },
  {
    name: "Pro Annual",
    planId: "pro-annual",
    price: "KES 3,500",
    priceDetails: "per year",
    features: [
      "Everything in Pro Monthly",
      "5 Months Free (Save 45%)",
      "Early Access to New Features",
    ],
    buttonText: "Upgrade to Annual",
    buttonVariant: "outline",
    href: "/checkout?plan=pro-annual",
    isFeatured: false,
    disabled: false,
  },
];

export default function PricingPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Choose Your Plan"
        description="Select the plan that best fits your learning ambitions and unlock your full potential."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.name} className={cn("flex flex-col h-full", tier.isFeatured && "border-primary shadow-lg")}>
            {tier.isFeatured && (
              <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1.5 rounded-t-lg">
                Most Popular
              </div>
            )}
            <CardHeader className="items-center text-center">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                 {tier.name.includes("Pro") ? <Crown className="text-primary" /> : <Star />}
                {tier.name}
              </CardTitle>
              <p className="text-4xl font-bold">{tier.price}</p>
              <CardDescription>{tier.priceDetails}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-muted-foreground">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={tier.href} className="w-full">
                <Button className="w-full" variant={tier.buttonVariant as any} disabled={tier.disabled}>
                  {tier.buttonText}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <Separator className="my-8" />
        <h3 className="text-xl font-bold mb-4">Not ready to subscribe?</h3>
        <Card className="inline-block">
          <CardHeader>
            <CardTitle>One-Off Purchase</CardTitle>
            <CardDescription>Don't need unlimited roadmaps? Buy one at a time.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">KES 100</p>
            <p className="text-muted-foreground">per additional roadmap</p>
          </CardContent>
          <CardFooter className="w-full px-4">
            <Link href="/checkout?plan=one-off" className="w-full">
                <Button variant="secondary" className="w-full">
                    <ShoppingCart className="mr-2"/>
                    Purchase Credit
                </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center text-muted-foreground text-sm max-w-2xl mx-auto pt-8">
        <p className="font-bold">A note on our mission:</p>
        <p>
          Our goal is to make personalized education accessible to everyone. The Pro plan helps us sustain our platform, verify high-quality mentors, and continue developing features for all users. Thank you for supporting our mission.
        </p>
      </div>
    </div>
  );
}
