"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const teamMembers = [
  { name: "Geoffrey Magana", role: "CEO & Founder", seed: "geoffrey" },
];

export default function AboutPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="About PathFinder AI"
        description="Democratizing personalized quality education for everyone, everywhere."
      />

      <div className="max-w-4xl mx-auto space-y-12">
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-muted-foreground">
            <p>
             Our mission is to bridge the gap between ambition and opportunity by providing personalized, AI-powered learning roadmaps. We believe in the power of accessible education and community support to unlock potential and create pathways to success for all.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-muted-foreground">
            <p>
              We envision a future where anyone, regardless of their background or location, has the tools to build a fulfilling life through continuous learning. We aim to be the lifelong learning companion that drives innovation and growth across the continent and beyond.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold text-center mb-8 font-headline">Meet the Team</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 justify-center">
            {teamMembers.map((member, index) => (
              <div key={`${member.name}-${index}`} className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                  <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${member.seed}`} alt={member.name} />
                  <AvatarFallback>{member.seed.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-primary">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
