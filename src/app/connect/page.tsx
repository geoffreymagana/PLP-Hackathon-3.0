
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, Crown, ExternalLink, Lock, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";


// --- MENTORS DATA ---
const mentors = [
    {
      name: "Dr. Adebayo Adekunle",
      avatarSeed: "adebayo",
      bio: "Lead AI Researcher at AfroInnovate Hub with 15+ years of experience in Machine Learning and Natural Language Processing.",
      tags: ["Artificial Intelligence", "Machine Learning", "Python"],
      verified: true,
    },
    {
      name: "Chiamaka Nwosu",
      avatarSeed: "chiamaka",
      bio: "Senior Product Designer at Paystack. Passionate about creating user-centric financial products for the African market.",
      tags: ["UI/UX Design", "FinTech", "Product Management"],
      verified: true,
    },
    {
      name: "Kwame Osei",
      avatarSeed: "kwame",
      bio: "Cybersecurity expert and founder of SecureAfrica. Specializes in ethical hacking and building secure digital infrastructures.",
      tags: ["Cybersecurity", "Network Security", "Cloud"],
      verified: true,
    },
    {
      name: "Fatima Al-Hassan",
      avatarSeed: "fatima",
      bio: "Full-stack developer and mentor, focused on empowering women in tech through code. Expert in MERN stack.",
      tags: ["JavaScript", "React", "Node.js", "Web Development"],
      verified: false,
    },
     {
      name: "Jelani Okoro",
      avatarSeed: "jelani",
      bio: "AgriTech innovator and founder of FarmConnect. Using IoT and data to revolutionize farming practices in Kenya.",
      tags: ["AgriTech", "IoT", "Data Analysis"],
      verified: true,
    },
     {
      name: "Aisha Ibrahim",
      avatarSeed: "aisha",
      bio: "Digital marketing strategist who has scaled multiple e-commerce brands across West Africa. Google certified.",
      tags: ["Digital Marketing", "SEO", "E-commerce"],
      verified: false,
    },
];

// --- COMMUNITIES DATA ---
const communities = [
    {
        name: "DevsInAfrica",
        logo: "/images/community/DevsInAfrica.webp",
        description: "A pan-African community for software developers to connect, collaborate, and grow. We host monthly virtual meetups and an annual conference.",
        country: "Pan-African",
        tags: ["Software Development", "Networking"],
        events: ["Monthly Tech Talk: Scaling with Kubernetes - July 25th"],
        link: "#",
        verified: true,
    },
    {
        name: "Women in Tech Africa",
        logo: "/images/community/WomenintechSmall.jpg",
        description: "Empowering women across Africa to excel in technology careers through mentorship, training, and networking opportunities.",
        country: "Pan-African",
        tags: ["Women in Tech", "Mentorship"],
        events: ["Annual Summit - Sept 10th-12th", "Coding Bootcamp applications open"],
        link: "#",
        verified: true,
    },
    {
        name: "PLP Africa",
        logo: "/images/community/PLP logo.webp",
        description: "A dynamic community dedicated to empowering African software developers with in-demand tech skills and connecting them with global opportunities.",
        country: "Pan-African",
        tags: ["Tech Education", "Career Development"],
        events: ["Cohort 9 Applications Open"],
        link: "#",
        verified: true,
    },
    {
        name: "NaijaHacks",
        logo: "/images/community/NaijaHacks.png",
        description: "A technology-focused community in Nigeria that inspires innovation and fosters creativity through hackathons and workshops.",
        country: "Nigeria",
        tags: ["Innovation", "Hackathons"],
        events: ["NaijaHacks 2024 Hackathon - Oct 5th"],
        link: "#",
        verified: true,
    },
    {
        name: "Ghana Tech Hub",
        logo: "/images/community/Ghana Tech Lab.png",
        description: "A community for tech enthusiasts in Ghana to learn, share, and build together. We offer co-working spaces and incubation programs.",
        country: "Ghana",
        tags: ["Startups", "Co-working"],
        events: ["Founder's Pitch Night - Aug 15th"],
        link: "#",
        verified: false,
    },
     {
        name: "PyCon Kenya",
        logo: "/images/community/python-logo.webp",
        description: "The official Python software community in Kenya. We organize meetups, conferences and training sessions for Python programmers.",
        country: "Kenya",
        tags: ["Python", "Programming"],
        events: ["PyCon KE 2024 - Nov 2nd-4th"],
        link: "#",
        verified: true,
    },
    {
        name: "SA Design Hub",
        logo: "/images/community/SA Design Hub.webp",
        description: "A community for UI/UX and Graphic Designers in South Africa. We host design challenges, portfolio reviews, and workshops.",
        country: "South Africa",
        tags: ["UI/UX Design", "Graphic Design"],
        events: ["Portfolio Review Day - July 30th"],
        link: "#",
        verified: false,
    }
];

type UserProfile = {
  isProUser?: boolean;
};

const MentorCard = ({ mentor, isProUser }: { mentor: typeof mentors[0], isProUser: boolean }) => (
    <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-16 w-16 border">
                <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${mentor.avatarSeed}`} alt={mentor.name} />
                <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{mentor.name}</CardTitle>
                    {mentor.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                </div>
                <CardDescription>Mentor</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">{mentor.bio}</p>
            <div className="flex flex-wrap gap-2">
                {mentor.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
        </CardContent>
        <CardFooter>
             {isProUser ? (
                <Button className="w-full">Connect</Button>
            ) : (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                            <Lock className="mr-2" />
                            Connect
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Upgrade to Pro to Connect</AlertDialogTitle>
                            <AlertDialogDescription>
                                Get direct access to experienced mentors and accelerate your career. Upgrade your plan to start the conversation.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Link href="/settings">
                                    <Crown className="mr-2"/>
                                    Upgrade
                                </Link>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </CardFooter>
    </Card>
);

const CommunityCard = ({ community }: { community: typeof communities[0] }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex items-start gap-4">
                 <Image src={community.logo} alt={`${community.name} logo`} width={64} height={64} className="rounded-lg border" data-ai-hint="logo" />
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{community.name}</CardTitle>
                        {community.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                    </div>
                    <CardDescription>{community.country}</CardDescription>
                 </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">{community.description}</p>
            <div className="space-y-2">
                <h4 className="font-semibold text-sm">Upcoming Events</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {community.events.map(event => (
                        <li key={event}>{event}</li>
                    ))}
                </ul>
            </div>
            <div className="flex flex-wrap gap-2">
                {community.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
            </div>
        </CardContent>
        <CardFooter>
            <Link href={community.link} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full">
                    Learn More <ExternalLink className="ml-2" />
                </Button>
            </Link>
        </CardFooter>
    </Card>
);

export default function ConnectPage() {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const defaultTab = searchParams.get('tab') === 'communities' ? 'communities' : 'mentors';
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if(user) {
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

    const filteredMentors = mentors.filter(mentor =>
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Connect & Grow</h1>
                <p className="text-muted-foreground">Find mentors and join communities to accelerate your career journey.</p>
            </header>

            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <TabsList className="grid grid-cols-2 w-full sm:w-auto h-auto">
                        <TabsTrigger value="mentors" className="py-2.5 text-sm">Mentors</TabsTrigger>
                        <TabsTrigger value="communities" className="py-2.5 text-sm">Communities</TabsTrigger>
                    </TabsList>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        placeholder="Search by name, keyword, or tag..."
                        className="pl-10 text-base h-12 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="mentors" className="mt-6">
                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-[400px] w-full" />
                            <Skeleton className="h-[400px] w-full" />
                            <Skeleton className="h-[400px] w-full" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMentors.map(mentor => <MentorCard key={mentor.avatarSeed} mentor={mentor} isProUser={!!userProfile?.isProUser} />)}
                        </div>
                    )}
                     {filteredMentors.length === 0 && !isLoading && (
                        <p className="text-muted-foreground text-center md:col-span-2 lg:col-span-3 py-8">
                            No mentors found for your search term.
                        </p>
                     )}
                </TabsContent>

                <TabsContent value="communities" className="mt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommunities.map(community => <CommunityCard key={community.name} community={community} />)}
                    </div>
                     {filteredCommunities.length === 0 && (
                        <p className="text-muted-foreground text-center md:col-span-2 lg:col-span-3 py-8">
                            No communities found for your search term.
                        </p>
                     )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

    