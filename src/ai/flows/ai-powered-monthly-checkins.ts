
'use server';
/**
 * @fileOverview Implements the AI-powered monthly check-in flow for personalized career guidance.
 *
 * - monthlyCheckin - A function that initiates the monthly check-in process.
 * - MonthlyCheckinInput - The input type for the monthlyCheckin function, capturing user progress and career goals.
 * - MonthlyCheckinOutput - The return type for the monthlyCheckin function, providing updated steps and new opportunities.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyCheckinInputSchema = z.object({
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
export type MonthlyCheckinInput = z.infer<typeof MonthlyCheckinInputSchema>;

const MonthlyCheckinOutputSchema = z.object({
  response: z
    .string()
    .describe('A brief, encouraging, and well-formatted markdown response. Praise good progress and offer support for challenges.'),
  suggestedPrompts: z.array(z.string()).describe('An array of 3-4 suggested follow-up questions the user might ask.'),
});
export type MonthlyCheckinOutput = z.infer<typeof MonthlyCheckinOutputSchema>;

export async function monthlyCheckin(input: MonthlyCheckinInput): Promise<MonthlyCheckinOutput> {
  return monthlyCheckinFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monthlyCheckinPrompt',
  input: {schema: MonthlyCheckinInputSchema},
  output: {schema: MonthlyCheckinOutputSchema},
  prompt: `You are an AI career coach. Your goal is to be encouraging and brief.

  CONTEXT:
  - User Profile: {{{userProfile}}}
  - Saved Roadmaps: {{{savedRoadmaps}}}
  - Completed Milestones: {{{completedMilestones}}}
  - Conversation History: {{{conversationHistory}}}
  - User's latest message: {{{currentProgress}}}

  TASK:
  1.  If the conversation history is empty, provide a brief, warm greeting. Otherwise, skip the greeting.
  2.  Look at the user's completed milestones.
  3.  If they have made good progress, offer specific praise.
  4.  If progress seems slow, be encouraging and offer support. Do not be critical.
  5.  Keep your response to 2-3 short paragraphs.
  6.  Provide the entire response in clean markdown format.
  7.  Generate 3-4 short, relevant follow-up questions or prompts the user might want to ask next. Examples: "How can I learn [skill]?" or "Tell me more about [topic]".
  `,
});

const monthlyCheckinFlow = ai.defineFlow(
  {
    name: 'monthlyCheckinFlow',
    inputSchema: MonthlyCheckinInputSchema,
    outputSchema: MonthlyCheckinOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
