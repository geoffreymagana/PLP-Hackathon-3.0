
'use server';

/**
 * @fileOverview Generates a step-by-step roadmap for a selected career path.
 *
 * - generateRoadmap - A function that generates a career roadmap.
 * - RoadmapGenerationInput - The input type for the generateRoadmap function.
 * - RoadmapGenerationOutput - The return type for the generateRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoadmapGenerationInputSchema = z.object({
  careerPath: z.string().describe('The selected career path for roadmap generation.'),
  userProfile: z.string().describe('The user profile including skills, interests, and education.'),
});
export type RoadmapGenerationInput = z.infer<typeof RoadmapGenerationInputSchema>;

const RoadmapGenerationOutputSchema = z.object({
  roadmap: z.array(
    z.object({
      step: z.string().describe('A step in the roadmap.'),
      skills: z.array(z.string()).describe('Skills to acquire for this step.'),
      milestones: z.array(z.string()).describe('Milestones to achieve in this step.'),
      resources: z.array(
        z.object({
          description: z.string().describe('A descriptive title for the resource.'),
          url: z.string().url().describe('The valid URL for the resource.'),
        })
      ).describe('Relevant resources for this step, each with a description and a valid, publicly accessible URL.'),
    })
  ).describe('The generated roadmap for the career path.'),
});
export type RoadmapGenerationOutput = z.infer<typeof RoadmapGenerationOutputSchema>;

export async function generateRoadmap(input: RoadmapGenerationInput): Promise<RoadmapGenerationOutput> {
  return generateRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'roadmapGenerationPrompt',
  input: {schema: RoadmapGenerationInputSchema},
  output: {schema: RoadmapGenerationOutputSchema},
  prompt: `You are an AI career coach that generates a step-by-step roadmap for users to achieve their desired career. The roadmap should be tailored to the African job market trends.

  Generate a roadmap including skills to acquire, milestones to achieve, and relevant resources based on the career path and user profile provided.

  Career Path: {{{careerPath}}}
  User Profile: {{{userProfile}}}

  IMPORTANT: The roadmap must be progressive and suitable for a beginner. It should always start with the absolute fundamentals of the career path and gradually build up to more advanced concepts. Do not skip foundational steps, even if the user profile suggests they might already know them. The goal is to provide a complete, foundational learning path from the ground up.

  The roadmap should be structured as a series of steps. For each step, list the skills to acquire, milestones to achieve, and resources to consult. For each resource, provide a descriptive title and a valid, publicly accessible URL.
  `,
});

const generateRoadmapFlow = ai.defineFlow(
  {
    name: 'generateRoadmapFlow',
    inputSchema: RoadmapGenerationInputSchema,
    outputSchema: RoadmapGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
