
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Briefcase, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { personalizedCareerSuggestions, PersonalizedCareerSuggestionsOutput } from '@/ai/flows/personalized-career-suggestions';
import { useToast } from '@/hooks/use-toast';

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

const CareerCard = ({ career, isSuggestion = false }: { career: any, isSuggestion?: boolean }) => {
    const skillsList = career.skills || career.suggestedSkillsToAcquire;
    const skillsArray = typeof skillsList === 'string' ? skillsList.split(',').map(s => s.trim()) : skillsList || [];

    return (
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
                    {skillsArray.slice(0, 3).map((skill:string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                    {skillsArray.length > 3 && <Badge variant="secondary">...</Badge>}
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`} className="w-full">
                    <Button variant={isSuggestion ? "default" : "outline"} className="w-full">
                        View Roadmap <ArrowRight className="ml-2" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<CareerSectors | "search">("Technology");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PersonalizedCareerSuggestionsOutput | null>(null);
  const { toast } = useToast();
  
  const sectors = Object.keys(careerData) as CareerSectors[];

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (searchTerm.trim().length < 3) {
          toast({ variant: "destructive", title: "Search term too short" });
          return;
      }
      
      setIsSearching(true);
      setActiveTab("search");
      setSearchResults(null);
      
      try {
          const suggestions = await personalizedCareerSuggestions({
              skills: "",
              interests: searchTerm,
              education: "",
              location: "Africa"
          });
          setSearchResults(suggestions);
      } catch (error) {
          toast({ variant: "destructive", title: "Search failed", description: "Could not fetch AI suggestions." });
      } finally {
          setIsSearching(false);
      }
  };

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
        <p className="text-muted-foreground">Browse curated paths or search for any career to get an AI-generated roadmap.</p>
      </header>

      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for any career, e.g., 'Poultry Farmer', 'YouTuber'..."
            className="pl-10 text-base h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </form>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
          {sectors.map((sector) => (
            <TabsTrigger key={sector} value={sector} className="py-2.5 text-sm">
              {sector}
            </TabsTrigger>
          ))}
           <TabsTrigger key="search" value="search" className="py-2.5 text-sm" disabled={!searchResults && !isSearching}>
              Search Results
            </TabsTrigger>
        </TabsList>
        {sectors.map((sector) => (
          <TabsContent key={sector} value={sector} className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
         <TabsContent value="search" className="mt-6">
            {isSearching && (
                <div className="flex flex-col items-center justify-center text-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Finding learning paths for "{searchTerm}"...</p>
                </div>
            )}
            {!isSearching && searchResults && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.careers.length > 0 ? (
                    searchResults.careers.map(career => (
                        <CareerCard key={career.title} career={career} isSuggestion={true} />
                    ))
                ) : (
                    <p className="text-muted-foreground text-center md:col-span-2 lg:col-span-3 py-8">
                        Could not find any AI-suggested paths for "{searchTerm}". Try a different search term.
                    </p>
                )}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
