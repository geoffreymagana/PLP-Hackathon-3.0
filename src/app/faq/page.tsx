
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";

const faqData = [
  {
    question: "What is PathFinder AI?",
    answer: "PathFinder AI is an AI-powered platform designed to provide personalized career guidance and roadmaps, specifically tailored for the African job market. We help you discover your potential, find the right career path, and connect with mentors and communities.",
  },
  {
    question: "How does the AI generate career suggestions?",
    answer: "Our AI analyzes the skills, interests, education, and location you provide during onboarding. It then cross-references this information with current trends and demands in the African job market to suggest career paths where you have the highest potential for success.",
  },
  {
    question: "Are the roadmaps personalized?",
    answer: "Yes. While the roadmaps are generated based on established learning paths for a given career, they take your profile into account to provide a comprehensive plan from foundational knowledge to advanced skills, ensuring there are no gaps in your learning.",
  },
  {
    question: "Can I save more than one roadmap?",
    answer: "Yes, you can save up to three different career roadmaps to your profile. This allows you to explore multiple interests simultaneously. You can manage your saved roadmaps from the 'My Roadmaps' page.",
  },
  {
    question: "How do I update my profile information?",
    answer: "You can update your profile information, including your name, skills, interests, and more, by navigating to the 'Settings' page from the user menu.",
  },
  {
    question: "Is my data secure?",
    answer: "We take data privacy very seriously. Your personal information is securely stored and is only used to power the AI features of the app, such as generating suggestions and personalizing your experience. We do not share your data with third parties without your consent.",
  },
];

export default function FaqPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about PathFinder AI."
      />
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

    