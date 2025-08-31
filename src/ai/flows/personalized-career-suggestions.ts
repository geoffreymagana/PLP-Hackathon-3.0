'use server';

/**
 * @fileOverview A personalized career suggestion AI agent.
 *
 * - personalizedCareerSuggestions - A function that handles the career suggestion process.
 * - PersonalizedCareerSuggestionsInput - The input type for the personalizedCareerSuggestions function.
 * - PersonalizedCareerSuggestionsOutput - The return type for the personalizedCareerSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCareerSuggestionsInputSchema = z.object({
  skills: z
    .string()
    .describe('A comma-separated list of the user\'s skills.'),
  interests: z
    .string()
    .describe('A comma-separated list of the user\'s interests.'),
  education: z
    .string()
    .describe('The user\'s highest level of education.'),
  location: z
    .string()
    .describe('The user\'s current location in Africa.'),
});
export type PersonalizedCareerSuggestionsInput = z.infer<typeof PersonalizedCareerSuggestionsInputSchema>;

const PersonalizedCareerSuggestionsOutputSchema = z.object({
  careers: z.array(
    z.object({
      title: z.string().describe('The title of the career.'),
      description: z.string().describe('A short description of the career.'),
      africanJobMarketDemand: z
        .string()
        .describe('The demand for this career in the African job market.'),
      suggestedSkillsToAcquire: z
        .string()
        .describe('Skills the user should acquire to be suitable for the career'),
      salaryRange: z.string().describe('The typical salary range for this career in Africa.'),
    })
  ).describe('An array of personalized career suggestions.'),
});
export type PersonalizedCareerSuggestionsOutput = z.infer<typeof PersonalizedCareerSuggestionsOutputSchema>;

export async function personalizedCareerSuggestions(input: PersonalizedCareerSuggestionsInput): Promise<PersonalizedCareerSuggestionsOutput> {
  return personalizedCareerSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedCareerSuggestionsPrompt',
  input: {schema: PersonalizedCareerSuggestionsInputSchema},
  output: {schema: PersonalizedCareerSuggestionsOutputSchema},
  prompt: `You are a career advisor specializing in the African job market. Based on the user's skills, interests, education and location, suggest relevant career paths.

Consider the current demand for each career in Africa, and provide a short description of each career, salary range, and list of skills the user should acquire to be suitable for the career.

Skills: {{{skills}}}
Interests: {{{interests}}}
Education: {{{education}}}
Location: {{{location}}}

Format your response as a JSON object matching the schema. Only include relevant and well-known careers in the African job market. Focus on opportunities within Africa and avoid careers that are not realistically attainable based on the user's background.
`,
});

const personalizedCareerSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedCareerSuggestionsFlow',
    inputSchema: PersonalizedCareerSuggestionsInputSchema,
    outputSchema: PersonalizedCareerSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
