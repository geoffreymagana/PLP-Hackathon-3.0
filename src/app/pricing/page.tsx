
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Basic",
    price: "Free",
    priceDetails: "Forever",
    features: [
      "AI-Powered Career Suggestions",
      "Up to 3 Roadmap Generations",
      "Up to 3 Roadmap Saves",
      "Community Access",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    href: "/",
    isFeatured: false,
  },
  {
    name: "Pro Monthly",
    price: "KES 200",
    priceDetails: "per month",
    features: [
      "Everything in Basic, plus:",
      "Unlimited Roadmap Generations",
      "Unlimited Roadmap Saves",
      "Direct Mentor Connections",
      "Advanced Progress Analytics",
      "Priority Support",
    ],
    buttonText: "Upgrade to Monthly",
    buttonVariant: "default",
    href: "/checkout?plan=monthly",
    isFeatured: true,
  },
  {
    name: "Pro Annual",
    price: "KES 3,500",
    priceDetails: "per year",
    features: [
      "Everything in Pro Monthly",
      "2 Months Free (20% Discount)",
      "Early Access to New Features",
    ],
    buttonText: "Upgrade to Annual",
    buttonVariant: "outline",
    href: "/checkout?plan=annual",
    isFeatured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Choose Your Plan"
        description="Select the plan that best fits your career ambitions and unlock your full potential."
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
                {tier.isFeatured ? <Star className="text-primary" /> : <Crown />}
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
                <Button className="w-full" variant={tier.buttonVariant as any} disabled={tier.name === 'Basic'}>
                  {tier.buttonText}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
