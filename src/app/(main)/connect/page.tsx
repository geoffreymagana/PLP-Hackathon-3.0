
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, Crown, ExternalLink, Lock, Search, Construction } from "lucide-react";
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
    // Finance & Agri-Finance
    {
        name: "Jennifer Riria",
        avatarSeed: "jennifer-riria",
        bio: "CEO of Kenya Women Holding Group; a leader in microfinance focused on rural women’s financial inclusion.",
        tags: ["Microfinance", "Women's Finance", "Financial Inclusion"],
        verified: true,
    },
    {
        name: "Wanja Yvonne Michuki",
        avatarSeed: "wanja-yvonne-michuki",
        bio: "MD at Be Bold Consulting & Advisory and board member at Kenya Agricultural Finance Corporation. An expert agri-finance strategist.",
        tags: ["Agri-finance", "Strategy", "Investment"],
        verified: true,
    },
    {
        name: "Samuel Karanja",
        avatarSeed: "samuel-karanja",
        bio: "Senior Regional Agriculture Manager at Mercy Corps AgriFin, specializing in value-chain finance.",
        tags: ["Value-Chain Finance", "Agri-finance", "Digital Tools"],
        verified: true,
    },
    {
        name: "Betty Muriithi",
        avatarSeed: "betty-muriithi",
        bio: "Regional Digital Financial Services Manager for AgriFin Accelerate, specializing in digital solutions for agriculture.",
        tags: ["Digital Financial Services", "Agri-finance", "FinTech"],
        verified: true,
    },
    {
        name: "Grace N. Njoroge",
        avatarSeed: "grace-n-njoroge",
        bio: "Program lead at Mercy Corps AgriFin, focusing on financial inclusion and digital outreach.",
        tags: ["Financial Inclusion", "Digital Outreach", "AgriFin"],
        verified: true
    },
    {
        name: "Sieka Gatabaki",
        avatarSeed: "sieka-gatabaki",
        bio: "Program lead at Mercy Corps AgriFin, focusing on financial inclusion and digital outreach.",
        tags: ["Financial Inclusion", "Digital Outreach", "AgriFin"],
        verified: true
    },

    // Agritech & Ecosystem
    {
        name: "Jamila Abbas",
        avatarSeed: "jamila-abbas",
        bio: "Co-founder & COO of M-Farm Kenya, a pioneering platform supporting farmers with market data.",
        tags: ["AgriTech", "Startups", "Farmer Tech"],
        verified: true,
    },
    {
        name: "Ada Osakwe",
        avatarSeed: "ada-osakwe",
        bio: "Founder of Agrolay Ventures and board member at One Acre Fund and AGRA. A specialist in agribusiness investment.",
        tags: ["Agribusiness", "Investment", "Venture Capital"],
        verified: true,
    },
    {
        name: "Amandla Ooko-Ombaka",
        avatarSeed: "amandla-ooko-ombaka",
        bio: "Partner at McKinsey Nairobi, leading regional agri and food security strategy.",
        tags: ["Agriculture Strategy", "Food Security", "Consulting"],
        verified: true
    },
    {
        name: "Dr. Leonard Oruko",
        avatarSeed: "dr-leonard-oruko",
        bio: "Group Director, Food & Agriculture at Equity Group Holdings, an expert in agri finance and policy.",
        tags: ["Agri-finance", "Policy", "Food Security"],
        verified: true
    },
    {
        name: "Phyllis Ombonyo",
        avatarSeed: "phyllis-ombonyo",
        bio: "Head of Strategic Partnerships, Africa at CABI, an expert in agri-sector partnerships.",
        tags: ["Partnerships", "Agriculture", "Agri-sector"],
        verified: true
    },

    // Tech & Digital Innovation
    {
        name: "Ory Okolloh Mwangi",
        avatarSeed: "ory-okolloh-mwangi",
        bio: "A renowned civic tech pioneer and co-initiator of the globally recognized Ushahidi platform.",
        tags: ["Civic Tech", "Innovation", "Open Source"],
        verified: true,
    },
    {
        name: "Linda Kamau",
        avatarSeed: "linda-kamau",
        bio: "Founder of AkiraChix, a mentor and trainer dedicated to providing coding education for young women in tech.",
        tags: ["Women in Tech", "Coding", "Education"],
        verified: true,
    },
    {
        name: "Juliana Rotich",
        avatarSeed: "juliana-rotich",
        bio: "Co-founder of Ushahidi & BRCK, and a leading strategist in the fintech space.",
        tags: ["FinTech", "Tech Infrastructure", "Innovation"],
        verified: true,
    },
    {
        name: "Dr. Shikoh Gitau",
        avatarSeed: "dr-shikoh-gitau",
        bio: "Founder & CEO of Qhala and former innovation lead at Safaricom, specializing in applying AI to real-world problems.",
        tags: ["AI", "Innovation", "Tech Leadership"],
        verified: true,
    },
    {
        name: "Kendi Ntwiga",
        avatarSeed: "kendi-ntwiga",
        bio: "Global tech leader with experience at Microsoft, Check Point, and HP. A champion for STEM mentorship.",
        tags: ["Tech Strategy", "Mentorship", "Leadership"],
        verified: true,
    },
    {
        name: "Chao Mbogho",
        avatarSeed: "chao-mbogho",
        bio: "Dean of Computer Science at Kenya Methodist University; leads coding mentorship through KamiLimu.",
        tags: ["Computer Science", "Academia", "Mentorship"],
        verified: true
    },
    {
        name: "Angela Oduor Lungati",
        avatarSeed: "angela-oduor-lungati",
        bio: "Executive Director, Ushahidi; open-source and digital inclusion advocate.",
        tags: ["Open Source", "Digital Inclusion", "Leadership"],
        verified: true
    },
    {
        name: "Judith Adem Owigar",
        avatarSeed: "judith-adem-owigar",
        bio: "Co-founder & President, AkiraChix; diversity champion in tech.",
        tags: ["Women in Tech", "Diversity", "Startups"],
        verified: true
    },
    {
        name: "Dr. Catherine Adeya",
        avatarSeed: "dr-catherine-adeya",
        bio: "Former CEO, Konza Technopolis; Internet governance expert.",
        tags: ["Internet Governance", "ICT Policy", "Tech Leadership"],
        verified: true,
    },
    {
        name: "Alice Munyua",
        avatarSeed: "alice-munyua",
        bio: "Director of Africa Innovation, Mozilla; ICT policy pioneer.",
        tags: ["ICT Policy", "Innovation", "Mozilla"],
        verified: true
    },
    {
        name: "Nekesa Were",
        avatarSeed: "nekesa-were",
        bio: "Founder, iHub and AfriLabs; tech startups ecosystem builder.",
        tags: ["Tech Hubs", "Startups", "Ecosystem Builder"],
        verified: true
    },
    {
        name: "Jessica Colaço",
        avatarSeed: "jessica-colaco",
        bio: "Influential leader in e-commerce and fintech.",
        tags: ["E-commerce", "FinTech", "Tech Leadership"],
        verified: true
    },
    {
        name: "Marie Githinji",
        avatarSeed: "marie-githinji",
        bio: "Influential leader in e-commerce and fintech.",
        tags: ["E-commerce", "FinTech", "Tech Leadership"],
        verified: true
    },
    {
        name: "Dorcas Muthoni",
        avatarSeed: "dorcas-muthoni",
        bio: "Influential leader in e-commerce and fintech.",
        tags: ["E-commerce", "FinTech", "Tech Leadership"],
        verified: true
    },
    {
        name: "Hilda Moraa",
        avatarSeed: "hilda-moraa",
        bio: "Influential leader in e-commerce and fintech.",
        tags: ["E-commerce", "FinTech", "Tech Leadership"],
        verified: true
    },
    {
        name: "Catherine Mahugu",
        avatarSeed: "catherine-mahugu",
        bio: "Influential leader in e-commerce and fintech.",
        tags: ["E-commerce", "FinTech", "Tech Leadership"],
        verified: true
    },
    {
        name: "Kathleen Siminyu",
        avatarSeed: "kathleen-siminyu",
        bio: "Influential leader in AI and mentoring.",
        tags: ["AI", "Mentoring", "Tech Leadership"],
        verified: true
    },
    {
        name: "Grace Murugi Wanjama",
        avatarSeed: "grace-murugi-wanjama",
        bio: "Influential leader in AI and mentoring.",
        tags: ["AI", "Mentoring", "Tech Leadership"],
        verified: true
    },
    {
        name: "Elizabeth Mwangi",
        avatarSeed: "elizabeth-mwangi",
        bio: "Influential leader in AI and mentoring.",
        tags: ["AI", "Mentoring", "Tech Leadership"],
        verified: true
    },
    {
        name: "Agnes Gathaiya",
        avatarSeed: "agnes-gathaiya",
        bio: "Influential leader in ecosystem strategy.",
        tags: ["Ecosystem Strategy", "Tech Leadership"],
        verified: true
    },
    {
        name: "Phyllis Migwi",
        avatarSeed: "phyllis-migwi",
        bio: "Influential leader in ecosystem strategy.",
        tags: ["Ecosystem Strategy", "Tech Leadership"],
        verified: true
    },
    {
        name: "Betty Mwangi",
        avatarSeed: "betty-mwangi",
        bio: "Influential leader in ecosystem strategy.",
        tags: ["Ecosystem Strategy", "Tech Leadership"],
        verified: true
    },

    // Cybersecurity
    {
        name: "Dr. Bright Gameli Mawudor",
        avatarSeed: "dr-bright-gameli-mawudor",
        bio: "CEO of Cyber Guard Africa and founder of Africahackon. A leading strategist in Cybersecurity and Blockchain.",
        tags: ["Cybersecurity", "Blockchain", "Strategy"],
        verified: true,
    },
    {
        name: "Evelyn Chepkirui Kilel",
        avatarSeed: "evelyn-chepkirui-kilel",
        bio: "Principal Cybersecurity Engineer at Safaricom and co-founder of SheHacksKE. One of the top 50 women in African cybersecurity.",
        tags: ["Cybersecurity", "Community Training", "DevSecOps"],
        verified: true,
    },
    {
        name: "Terry W. Macharia",
        avatarSeed: "terry-w-macharia",
        bio: "IT security leader and mentor at iHub, holding multiple certifications including CEH, CISA, and CISM.",
        tags: ["IT Security", "Cyber Hygiene", "Mentorship"],
        verified: true,
    },
    {
        name: "Nancy Njeri Muriithi",
        avatarSeed: "nancy-njeri-muriithi",
        bio: "Cybersecurity consultant & mentor; former outreach head at RCD Africa; trainer at SheHacksKE and M-PESA Academy.",
        tags: ["Cybersecurity", "Training", "Mentorship"],
        verified: true
    },
    {
        name: "Maurine Chepkoech",
        avatarSeed: "maurine-chepkoech",
        bio: "Cybersecurity researcher focused on mobile security and reverse engineering at e.KRAAL Innovation Hub.",
        tags: ["Cybersecurity Research", "Mobile Security", "Reverse Engineering"],
        verified: true
    },
    {
        name: "Charity Wamboi Ng’ang’a",
        avatarSeed: "charity-wamboi-nganga",
        bio: "Cybersecurity analyst and AFCHIX program mentor.",
        tags: ["Cybersecurity", "Mentorship", "Community"],
        verified: true
    },

    // Social Impact & Leadership
    {
        name: "Mumbi Ndung’u",
        avatarSeed: "mumbi-ndungu",
        bio: "Executive Director at Power Learn Project Africa, leading large-scale digital inclusion and skills-to-jobs programs for youth.",
        tags: ["Digital Skills", "Youth Development", "Social Impact"],
        verified: true,
    }
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
        description: "Focuses on bridging the tech talent gap by providing industry-aligned training, mentorship, and job placement support.",
        country: "Kenya",
        tags: ["Tech Training", "Job Placement", "Mentorship"],
        events: ["Data Science Bootcamp applications open"],
        link: "https://techcultivate.co.ke/",
        verified: true,
    }
];

const MentorCard = ({ mentor, isProUser }: { mentor: any, isProUser?: boolean }) => (
    <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={`https://api.dicebear.com/8.x/identicon/svg?seed=${mentor.avatarSeed}`} alt={mentor.name} />
                <AvatarFallback>{mentor.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg flex items-center gap-2">
                    {mentor.name}
                    {mentor.verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                    <CardDescription>{mentor.tags[0]}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 text-sm text-muted-foreground">
            {mentor.bio}
        </CardContent>
        <CardFooter>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={!isProUser}>
                        {!isProUser && <Lock className="mr-2 h-4 w-4" />}
                        Connect
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><Construction />Feature Coming Soon!</AlertDialogTitle>
                        <AlertDialogDescription>
                            We are working hard to build a robust and safe mentorship platform. The direct connection feature is currently in development and will be launched for Pro subscribers soon. Stay tuned!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>Got it, thanks!</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);

const CommunityCard = ({ community }: { community: any }) => (
    <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-12 w-12 rounded-lg border">
                <AvatarImage src={community.logo} alt={community.name} className="object-contain" />
                <AvatarFallback>{community.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg flex items-center gap-2">
                    {community.name}
                    {community.verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                </CardTitle>
                 <div className="flex items-center gap-2 mt-1">
                    <CardDescription>{community.country}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">{community.description}</p>
             <div className="flex flex-wrap gap-2">
                {community.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
        </CardContent>
        <CardFooter>
            <Link href={community.link} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full">
                    Visit Website <ExternalLink className="ml-2 h-4 w-4"/>
                </Button>
            </Link>
        </CardFooter>
    </Card>
);

function ConnectPageContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'mentors';
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState<{ isProUser?: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
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

    if (isLoading) {
        return (
             <div className="p-4 md:p-8 space-y-8 animate-pulse">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Connect & Grow</h1>
                    <p className="text-muted-foreground">Find mentors and communities to accelerate your learning journey.</p>
                </header>
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Connect & Grow</h1>
                <p className="text-muted-foreground">Find mentors and communities to accelerate your learning journey.</p>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, tag, or keyword..."
                    className="pl-10 text-base h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mentors">Mentors</TabsTrigger>
                    <TabsTrigger value="communities">Communities</TabsTrigger>
                </TabsList>
                <TabsContent value="mentors" className="mt-6">
                     {!userProfile?.isProUser && (
                        <Card className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                            <CardHeader className="flex flex-row items-center gap-4">
                                 <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                                    <Crown className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                                </div>
                                <div>
                                <CardTitle className="text-amber-900 dark:text-amber-100">Unlock Direct Connections</CardTitle>
                                <CardDescription className="text-amber-700 dark:text-amber-300">
                                    Upgrade to Pro to connect directly with verified mentors.
                                </CardDescription>
                                </div>
                            </CardHeader>
                             <CardFooter>
                                <Link href="/pricing">
                                    <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">View Pro Plans</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    )}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMentors.map((mentor, index) => (
                            <MentorCard key={`${mentor.avatarSeed}-${index}`} mentor={mentor} isProUser={userProfile?.isProUser}/>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="communities" className="mt-6">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommunities.map((community, index) => (
                           <CommunityCard key={`${community.name}-${index}`} community={community} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ConnectPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <ConnectPageContent />
        </Suspense>
    );
}
