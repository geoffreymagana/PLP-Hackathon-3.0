
'use server';
/**
 * @fileOverview Implements the AI-Micro-Tutor for personalized career guidance.
 *
 * - microTutorChat - A function that initiates the chat process.
 * - MicroTutorChatInput - The input type for the microTutorChat function, capturing user progress and career goals.
 * - MicroTutorChatOutput - The return type for the microTutorChat function, providing updated steps and new opportunities.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MicroTutorChatInputSchema = z.object({
  userProfile: z
    .string()
    .describe('The user profile, including skills, interests, and education.'),
  careerGoal: z.string().describe('The user selected career path.'),
  currentProgress: z
    .string()
    .describe('A description of the user current progress on their career roadmap.'),
  savedRoadmaps: z
    .string()
    .describe('A JSON string of the user\'s saved roadmaps for context.'),
  completedMilestones: z
    .string()
    .describe('A JSON string of the user\'s completed milestones.'),
  conversationHistory: z
    .string()
    .describe('A JSON string of the previous conversation messages.'),
});
export type MicroTutorChatInput = z.infer<typeof MicroTutorChatInputSchema>;

const MicroTutorChatOutputSchema = z.object({
  response: z
    .string()
    .describe('A brief, encouraging, and well-formatted markdown response. Praise good progress and offer support for challenges.'),
  suggestedPrompts: z.array(z.string()).describe('An array of 3-4 suggested follow-up questions the user might ask.'),
});
export type MicroTutorChatOutput = z.infer<typeof MicroTutorChatOutputSchema>;

export async function microTutorChat(input: MicroTutorChatInput): Promise<MicroTutorChatOutput> {
  return microTutorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'microTutorChatPrompt',
  input: {schema: MicroTutorChatInputSchema},
  output: {schema: MicroTutorChatOutputSchema},
  prompt: `You are an AI-Micro-Tutor (Chat AMT). Your primary goal is to provide encouraging, clear, and highly actionable advice. Avoid generic pleasantries and focus on concrete, step-by-step guidance.

  CONTEXT:
  - User Profile: {{{userProfile}}}
  - Saved Roadmaps: {{{savedRoadmaps}}}
  - Completed Milestones: {{{completedMilestones}}}
  - Conversation History: {{{conversationHistory}}}
  - User's latest message: {{{currentProgress}}}

  TASK:
  1.  If the user's message is a greeting or initial check-in, provide a brief, warm welcome and ask what they need help with.
  2.  If the user asks a specific question (like "How do I get into cybersecurity without a degree?"), provide a detailed, actionable, and well-structured response. For example, for the cybersecurity question, you should provide a step-by-step plan:
      *   **Phase 1: Foundational Knowledge:** Suggest starting with CompTIA A+ and Network+ to understand hardware and networking. Mention free resources like Professor Messer on YouTube.
      *   **Phase 2: Core Cybersecurity Skills:** Recommend getting the CompTIA Security+ certification as the industry-standard entry point.
      *   **Phase 3: Practical, Hands-On Experience:** Suggest building a home lab, participating in Capture The Flag (CTF) events on platforms like TryHackMe or HackTheBox, and contributing to open-source security projects.
      *   **Phase 4: Specialize and Network:** Mention specializing in areas like cloud security (AWS/Azure certs) or penetration testing. Emphasize creating a professional LinkedIn profile and attending local tech meetups.
  3.  If the user is sharing progress, review their completed milestones. If progress is good, offer specific praise. If it seems slow, be encouraging and suggest focusing on the next small step.
  4.  Keep your response concise but comprehensive. Use markdown (bolding, lists) for readability.
  5.  Generate 3-4 short, relevant follow-up questions the user might ask next. Examples: "Tell me more about home labs," or "Which CTF platform is best for beginners?"
  `,
});

const microTutorChatFlow = ai.defineFlow(
  {
    name: 'microTutorChatFlow',
    inputSchema: MicroTutorChatInputSchema,
    outputSchema: MicroTutorChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
