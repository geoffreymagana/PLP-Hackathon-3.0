
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
    answer: "PathFinder AI is your personal AI-powered lifelong learning assistant. We provide customized learning roadmaps tailored to your skills and goals, helping you navigate your educational and professional journey with clarity.",
  },
  {
    question: "How does the AI generate learning roadmaps?",
    answer: "Our AI analyzes your skills, interests, and educational background. It then cross-references this with effective learning paths and in-demand skills to generate a step-by-step roadmap, complete with curated free resources like articles, YouTube tutorials, and open-source courses.",
  },
  {
    question: "How many free roadmaps can I generate?",
    answer: "On our free Basic plan, you can generate and save up to three personalized learning roadmaps. For unlimited roadmaps and advanced features, you can upgrade to our Pro plan.",
  },
  {
    question: "Are the roadmaps personalized?",
    answer: "Yes, completely. Instead of a one-size-fits-all curriculum, PathFinder generates a learning journey that is customized to your starting point, aspirations, and available time, ensuring an efficient and effective learning experience.",
  },
  {
    question: "How can I earn as a mentor on PathFinder AI?",
    answer: "Verified mentors have the opportunity to earn by hosting paid group sessions on our platform. We operate on a revenue-share model, where you set the price for your sessions, and we handle the platform and payment processing for a small fee. It's a great way to share your knowledge and build your brand.",
  },
  {
    question: "Can I use PathFinder for more than just starting a new career?",
    answer: "Absolutely. PathFinder is designed for lifelong learning. You can use it to upskill in your current role, learn a new technology, develop soft skills, explore a hobby, or even chart a path toward entrepreneurship.",
  },
  {
    question: "How do I update my profile information?",
    answer: "You can update your profile information—including your skills, interests, and more—by navigating to the 'Settings' page from the user menu. Keeping your profile updated helps the AI provide you with the best possible recommendations.",
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
