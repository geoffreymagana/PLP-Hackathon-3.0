
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
import { useEffect, useState, Suspense } from "react";
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
        name: "ALX Africa",
        logo: "/images/community/ALX logo.svg",
        description: "Offers immersive training in tech and professional skills for young professionals across Africa, including programs in Data Science, AI, and Cybersecurity.",
        country: "Pan-African",
        tags: ["Tech Education", "Career Development", "Soft Skills"],
        events: ["AI Career Essentials applications open"],
        link: "https://www.alxafrica.com/",
        verified: true,
    },
    {
        name: "Power Learn Project (PLP)",
        logo: "/images/community/PLP logo.webp",
        description: "A Pan-African initiative aiming to train 1 million developers. Offers a 16-week funded program covering programming, Blockchain, and AI.",
        country: "Pan-African",
        tags: ["Developer Training", "Web3", "Blockchain", "Scholarships"],
        events: ["Cohort 9 Applications Open", "Coffee & Code Meetup"],
        link: "https://www.powerlearnprojectafrica.org/",
        verified: true,
    },
    {
        name: "Tech Sisters Kenya",
        logo: "/images/community/Tech sisters Kenya.jpeg",
        description: "A nonprofit empowering women in tech through workshops, mentorship, and career fairs to foster inclusivity and growth.",
        country: "Kenya",
        tags: ["Women in Tech", "Mentorship", "Workshops"],
        events: ["Annual Tech Career Fair - Aug 20th"],
        link: "https://techsisterskenya.org/",
        verified: true,
    },
    {
        name: "Women in Tech Africa",
        logo: "/images/community/WomenintechSmall.jpg",
        description: "Empowering women across Africa to excel in technology careers through mentorship, training, and networking opportunities.",
        country: "Pan-African",
        tags: ["Women in Tech", "Mentorship", "Networking"],
        events: ["Annual Summit - Sept 10th-12th"],
        link: "http://www.womenintechafrica.com/",
        verified: true,
    },
    {
        name: "She Code Africa",
        logo: "/images/community/She Codes Africa.png",
        description: "Empowers African women with technical skills through mentorship, workshops, and scholarships. Has chapters across the continent.",
        country: "Pan-African",
        tags: ["Women in Tech", "Coding", "Scholarships"],
        events: ["Mentorship Program Cohort 5 starting soon"],
        link: "https://shecodeafrica.org/",
        verified: true,
    },
    {
        name: "iHub",
        logo: "/images/community/iHub.png",
        description: "A pioneering innovation hub in Nairobi, serving as a nexus for tech entrepreneurs, developers, and investors since 2010.",
        country: "Kenya",
        tags: ["Startups", "Innovation", "Co-working"],
        events: ["Weekly Pitch Friday"],
        link: "https://ihub.co.ke/",
        verified: true,
    },
    {
        name: "Devs Kenya",
        logo: "/images/community/Devs Kenya.png",
        description: "A directory of diverse developer groups in Kenya, including GDG Nairobi, Python Kenya, Nairobi JavaScript Community, and more.",
        country: "Kenya",
        tags: ["Developer Groups", "Networking", "Meetups"],
        events: ["Nairobi JavaScript Meetup - Last Thursday of the month"],
        link: "https://devs.info.ke/",
        verified: true,
    },
    {
        name: "Code for Africa",
        logo: "/images/community/Code for Africa.png",
        description: "A nonprofit promoting data journalism, fact-checking, and digital democracy across 21 African countries.",
        country: "Pan-African",
        tags: ["Data Journalism", "Civic Tech", "Advocacy"],
        events: ["Weekly office hours on data visualization"],
        link: "https://codeforafrica.org/",
        verified: true,
    },
    {
        name: "Tech Herfrica",
        logo: "/images/community/Tech Herfrica.png",
        description: "An NGO focused on digital and financial inclusion for rural African women, offering tools, training, and market data.",
        country: "Pan-African",
        tags: ["AgriTech", "Rural Empowerment", "Financial Inclusion"],
        events: ["HerLocal Market onboarding session"],
        link: "#",
        verified: false,
    },
    {
        name: "Techworker Community Africa (TCA)",
        logo: "/images/community/Techworker Community Africa (TCA).jpeg",
        description: "Focuses on advocacy and social impact, offering civic education, psychological support, and policy engagement for tech workers.",
        country: "Pan-African",
        tags: ["Tech Advocacy", "Social Impact", "Policy"],
        events: ["Monthly Policy Roundtable"],
        link: "https://techworkercommunityafrica.org/",
        verified: false,
    },
    {
        name: "Pulse Africa",
        logo: "/images/community/Pulse Africa.jpeg",
        description: "A major digital media network covering news, entertainment, and digital marketing, with initiatives like the Creators of Tomorrow campaign.",
        country: "Pan-African",
        tags: ["Digital Media", "Content Creation", "Marketing"],
        events: ["Influencer Awards nominations open"],
        link: "#",
        verified: true,
    },
    {
        name: "Techfugees Kenya",
        logo: "/images/community/Techfugees Kenya.png",
        description: "A chapter supporting refugees and displaced communities through technology, developing digital health and education tools.",
        country: "Kenya",
        tags: ["Tech for Good", "Refugee Support", "Digital Health"],
        events: ["Hackathon for Humanity - Oct 12th"],
        link: "https://techfugees.com/en/chapters/kenya-nairobi/",
        verified: true,
    },
    {
        name: "AkiraChix",
        logo: "/images/community/AkiraChix.jpeg",
        description: "A trailblazing organization offering coding training and mentorship for women across Kenya, founded in 2010.",
        country: "Kenya",
        tags: ["Women in Tech", "Coding", "Mentorship"],
        events: ["CodeHive Program applications"],
        link: "#",
        verified: true,
    },
    {
        name: "KamiLimu",
        logo: "/images/community/KamiLimu.png",
        description: "A mentorship program for university students delivering soft skills, public speaking, and career prep alongside tech.",
        country: "Kenya",
        tags: ["Mentorship", "Soft Skills", "Students"],
        events: ["Cohort applications open"],
        link: "https://www.kamilimu.org/apply",
        verified: true,
    },
    {
        name: "Infitech Community",
        logo: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%205%205%22%20fill%3D%22none%22%20shape-rendering%3D%22crispEdges%22%3E%3Cmetadata%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%20xmlns%3Axsi%3D%22http%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema-instance%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20xmlns%3Adcterms%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%22%3E%3Crdf%3ARDF%3E%3Crdf%3ADescription%3E%3Cdc%3Atitle%3EIdenticon%3C%2Fdc%3Atitle%3E%3Cdc%3Acreator%3EDiceBear%3C%2Fdc%3Acreator%3E%3Cdc%3Asource%20xsi%3Atype%3D%22dcterms%3AURI%22%3Ehttps%3A%2F%2Fwww.dicebear.com%3C%2Fdc%3Asource%3E%3Cdcterms%3Alicense%20xsi%3Atype%3D%22dcterms%3AURI%22%3Ehttps%3A%2F%2Fcreativecommons.org%2Fpublicdomain%2Fzero%2F1.0%2F%3C%2Fdcterms%3Alicense%3E%3Cdc%3Arights%3E%E2%80%9EIdenticon%E2%80%9D%20(https%3A%2F%2Fwww.dicebear.com)%20by%20%E2%80%9EDiceBear%E2%80%9D%2C%20licensed%20under%20%E2%80%9ECC0%201.0%E2%80%9D%20(https%3A%2F%2Fcreativecommons.org%2Fpublicdomain%2Fzero%2F1.0%2F)%3C%2Fdc%3Arights%3E%3C%2Frdf%3ADescription%3E%3C%2Frdf%3ARDF%3E%3C%2Fmetadata%3E%3Cmask%20id%3D%22viewboxMask%22%3E%3Crect%20width%3D%225%22%20height%3D%225%22%20rx%3D%220%22%20ry%3D%220%22%20x%3D%220%22%20y%3D%220%22%20fill%3D%22%23fff%22%20%2F%3E%3C%2Fmask%3E%3Cg%20mask%3D%22url(%23viewboxMask)%22%3E%3Cpath%20fill%3D%22%23d81b60%22%20d%3D%22M0%200h5v1H0z%22%2F%3E%3Cpath%20d%3D%22M2%201H1v1h1V1ZM4%201H3v1h1V1Z%22%20fill%3D%22%23d81b60%22%2F%3E%3Cpath%20d%3D%22M2%202H0v1h2V2ZM5%202H3v1h2V2Z%22%20fill%3D%22%23d81b60%22%2F%3E%3Cpath%20d%3D%22M0%203h1v1H0V3ZM4%203h1v1H4V3ZM3%203H2v1h1V3Z%22%20fill%3D%22%23d81b60%22%2F%3E%3Cpath%20d%3D%22M2%204H1v1h1V4ZM4%204H3v1h1V4Z%22%20fill%3D%22%23d81b60%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E",
        description: "Based in Mombasa, it empowers women through its 'Her Innovation' program, combining tech, leadership, and entrepreneurship.",
        country: "Kenya",
        tags: ["Women in Tech", "Leadership", "Mombasa"],
        events: ["Her Innovation Demo Day"],
        link: "https://infitechcommunity.co.ke/",
        verified: false,
    },
    {
        name: "TechCultivate Kenya",
        logo: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%205%205%22%20fill%3D%22none%22%20shape-rendering%3D%22crispEdges%22%3E%3Cmetadata%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%20xmlns%3Axsi%3D%22http%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema-instance%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20xmlns%3Adcterms%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%22%3E%3Crdf%3ARDF%3E%3Crdf%3ADescription%3E%3Cdc%3Atitle%3EIdenticon%3C%2Fdc%3Atitle%3E%3Cdc%3Acreator%3EDiceBear%3C%2Fdc%3Acreator%3E%3Cdc%3Asource%20xsi%3Atype%3D%22dcterms%3AURI%22%3Ehttps%3A%2F%2Fwww.dicebear.com%3C%2Fdc%3Asource%3E%3Cdcterms%3Alicense%20xsi%3Atype%3D%22dcterms%3AURI%22%3Ehttps%3A%2F%2Fcreativecommons.org%2Fpublicdomain%2Fzero%2F1.0%2F%3C%2Fdcterms%3Alicense%3E%3Cdc%3Arights%3E%E2%80%9EIdenticon%E2%80%9D%20(https%3A%2F%2Fwww.dicebear.com)%20by%20%E2%80%9EDiceBear%E2%80%9D%2C%20licensed%20under%20%E2%80%9ECC0%201.0%E2%80%9D%20(https%3A%2F%2Fcreativecommons.org%2Fpublicdomain%2Fzero%2F1.0%2F)%3C%2Fdc%3Arights%3E%3C%2Frdf%3ADescription%3E%3C%2Frdf%3ARDF%3E%3C%2Fmetadata%3E%3Cmask%20id%3D%22viewboxMask%22%3E%3Crect%20width%3D%225%22%20height%3D%225%22%20rx%3D%220%22%20ry%3D%220%22%20x%3D%220%22%20y%3D%220%22%20fill%3D%22%23fff%22%20%2F%3E%3C%2Fmask%3E%3Cg%20mask%3D%22url(%23viewboxMask)%22%3E%3Cpath%20d%3D%22M0%200h1v1H0V0ZM4%200h1v1H4V0ZM3%200H2v1h1V0Z%22%20fill%3D%22%23fdd835%22%2F%3E%3Cpath%20fill%3D%22%23fdd835%22%20d%3D%22M0%201h5v1H0z%22%2F%3E%3Cpath%20d%3D%22M0%202h1v1H0V2ZM4%202h1v1H4V2ZM3%202H2v1h1V2Z%22%20fill%3D%22%23fdd835%22%2F%3E%3Cpath%20d%3D%22M0%203h1v1H0V3ZM4%203h1v1H4V3ZM3%203H2v1h1V3Z%22%20fill%3D%22%23fdd835%22%2F%3E%3Cpath%20d%3D%22M0%204h1v1H0V4ZM4%204h1v1H4V4ZM3%204H2v1h1V4Z%22%20fill%3D%22%23fdd835%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E",
        description: "A youth-oriented initiative providing coding workshops, mentorship, and tech events to cultivate young innovators in underserved areas.",
        country: "Kenya",
        tags: ["Youth", "Coding", "Innovation"],
        events: ["Annual Youth Tech Fair"],
        link: "https://techcultivate.org/",
        verified: false,
    },
    {
        name: "Women Who Code",
        logo: "/images/community/Women Who Code.png",
        description: "A global organization offering women in tech access to learning resources, hackathons, and networking events.",
        country: "Global / Pan-African Chapters",
        tags: ["Women in Tech", "Global Network", "Hackathons"],
        events: ["Connect Forward 2024"],
        link: "https://womenwhocode.com/",
        verified: true,
    },
    {
        name: "TechGetAfrica",
        logo: "/images/community/TechGetAfrica.png",
        description: "A vibrant tech community spanning 12 African countries with over 50,000 members, offering meetups, forums, and hackathons.",
        country: "Pan-African",
        tags: ["Networking", "Meetups", "Forums"],
        events: ["Annual Tech Outlook Summit"],
        link: "https://techgetafrica.co.ke/communities",
        verified: false,
    },
    {
        name: "African Centre for Technology Studies (ACTS)",
        logo: "/images/community/African Centre for Technology Studies (ACTS).png",
        description: "A Nairobi-based think tank focused on policy research for harnessing science and technology for sustainable development.",
        country: "Kenya",
        tags: ["Policy", "Research", "Sustainability"],
        events: ["Annual Research Symposium"],
        link: "https://acts-net.org/",
        verified: true,
    },
    {
        name: "Afriwork",
        logo: "/images/community/Afriwork.jpeg",
        description: "An HR tech and freelance job marketplace connecting East African jobseekers with SMEs via web and Telegram services.",
        country: "East Africa",
        tags: ["Freelancing", "Jobs", "HR Tech"],
        events: ["Freelancer of the Year Awards"],
        link: "https://afriworket.com/",
        verified: false,
    },
    {
        name: "Bundle Africa",
        logo: "/images/community/Bundle Africa.png",
        description: "A social payment and crypto platform enabling peer-to-peer trading, savings, and fiat exchange, fostering crypto inclusion.",
        country: "Pan-African",
        tags: ["Crypto", "FinTech", "Blockchain"],
        events: ["Weekly Crypto Market Analysis"],
        link: "https://en.wikipedia.org/wiki/Bundle_Africa",
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
                <AvatarImage
                    src={`https://api.dicebear.com/8.x/identicon/svg?seed=${mentor.avatarSeed}`}
                    alt={mentor.name}
                />
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
                            <Lock className="mr-2 h-4 w-4" />
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
                                    <Crown className="mr-2 h-4 w-4" />
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

const CommunityCard = ({ community }: { community: typeof communities[0] }) => {
    const logoSrc =
    community.logo && community.logo.length > 0
      ? community.logo
      : `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(community.name)}`;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start gap-4">
                     <Image src={logoSrc} alt={`${community.name} logo`} width={64} height={64} className="rounded-lg border object-contain" data-ai-hint="logo" />
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
                        Learn More <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

const ConnectSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <header className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
        </header>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Skeleton className="h-12 w-full sm:w-48" />
            <Skeleton className="h-12 flex-1" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    </div>
);


function ConnectPageContent() {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const defaultTab = searchParams.get('tab') === 'communities' ? 'communities' : 'mentors';
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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


export default function ConnectPage() {
    return (
        <Suspense fallback={<ConnectSkeleton />}>
            <ConnectPageContent />
        </Suspense>
    )
}
