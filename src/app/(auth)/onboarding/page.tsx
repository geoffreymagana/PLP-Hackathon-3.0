"use client";

import { Onboarding } from "@/components/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();

    const handleOnboardingComplete = () => {
        router.push('/');
    };

    return <Onboarding onOnboardingComplete={handleOnboardingComplete} />;
}
