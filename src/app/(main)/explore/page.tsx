"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Briefcase, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Sample data - in a real app, this would come from a database or API
const careerData = {
  "Technology": [
    { title: "Software Engineer", description: "Designs, develops, and maintains software applications.", skills: ["JavaScript", "React", "Node.js", "Python", "Databases"] },
    { title: "Data Scientist", description: "Analyzes and interprets complex data to help organizations make better decisions.", skills: ["Python", "R", "SQL", "Machine Learning", "Statistics"] },
    { title: "Cybersecurity Analyst", description: "Protects computer networks and systems from security breaches.", skills: ["Network Security", "Penetration Testing", "Cryptography", "Linux"] },
    { title: "Cloud Engineer", description: "Manages and maintains cloud infrastructure for businesses.", skills: ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD"] },
    { title: "Blockchain Developer", description: "Specializes in developing applications using blockchain technology.", skills: ["Solidity", "Ethereum", "Cryptography", "Smart Contracts"] },
  ],
  "Healthcare": [
    { title: "Telemedicine Physician", description: "Provides remote medical care to patients using technology.", skills: ["Medical Software", "Virtual Communication", "HIPAA"] },
    { title: "Health Informatics Specialist", description: "Manages and analyzes healthcare data to improve patient care.", skills: ["SQL", "Healthcare IT", "Data Analysis", "HL7"] },
    { title: "Biomedical Engineer", description: "Designs and creates equipment, devices, and software used in healthcare.", skills: ["CAD", "Biomaterials", "Signal Processing"] },
  ],
  "Creative Industries": [
    { title: "Digital Marketer", description: "Promotes brands and products online through various digital channels.", skills: ["SEO", "SEM", "Content Marketing", "Social Media"] },
    { title: "Content Creator", description: "Produces entertaining or educational material for online audiences.", skills: ["Video Editing", "Copywriting", "Graphic Design"] },
    { title: "UX/UI Designer", description: "Focuses on creating user-friendly and visually appealing digital products.", skills: ["Figma", "Adobe XD", "User Research", "Prototyping"] },
  ],
  "AgriTech": [
      { title: "Agricultural Drone Pilot", description: "Operates drones to monitor crop health and optimize farming practices.", skills: ["Drone Operation", "GIS", "Data Analysis"] },
      { title: "AgriTech Solutions Developer", description: "Creates software and hardware to improve agricultural efficiency.", skills: ["IoT", "Python", "Embedded Systems"] },
  ],
  "FinTech": [
      { title: "Fintech Product Manager", description: "Oversees the development of financial technology products.", skills: ["Agile", "Product Roadmapping", "Market Analysis"] },
      { title: "Mobile Money Agent Network Manager", description: "Manages and expands networks of mobile money agents.", skills: ["Logistics", "Agent Training", "Sales"] },
  ]
};

type Career = {
  title: string;
  description: string;
  skills: string[];
};

type CareerSectors = keyof typeof careerData;

const CareerCard = ({ career }: { career: Career }) => (
    <Card className="group hover:shadow-lg hover:border-primary transition-all duration-300 flex flex-col">
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{career.title}</CardTitle>
                <Briefcase className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <CardDescription>{career.description}</CardDescription>
            <div className="flex flex-wrap gap-2">
                {career.skills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
                {career.skills.length > 3 && <Badge variant="secondary">...</Badge>}
            </div>
        </CardContent>
        <div className="p-6 pt-0">
             <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`}>
                <Button variant="outline" className="w-full">
                    View Roadmap <ArrowRight className="ml-2" />
                </Button>
            </Link>
        </div>
    </Card>
);

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const sectors = Object.keys(careerData) as CareerSectors[];

  const filteredCareers = (sector: CareerSectors) =>
    careerData[sector].filter(career =>
      career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Learning Paths</h1>
        <p className="text-muted-foreground">Discover a wide range of learning journeys and find the one that's right for you.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search paths by title, description, or skill..."
          className="pl-10 text-base h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue={sectors[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
          {sectors.map((sector) => (
            <TabsTrigger key={sector} value={sector} className="py-2.5 text-sm">
              {sector}
            </TabsTrigger>
          ))}
        </TabsList>
        {sectors.map((sector) => (
          <TabsContent key={sector} value={sector}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredCareers(sector).length > 0 ? (
                filteredCareers(sector).map(career => (
                    <CareerCard key={career.title} career={career} />
                ))
              ) : (
                <p className="text-muted-foreground text-center md:col-span-2 lg:col-span-3 py-8">
                  No learning paths found in this sector for your search term.
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
