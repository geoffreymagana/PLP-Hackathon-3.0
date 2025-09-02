import { z } from 'zod';

export const MicroTutorChatMode = z.enum(['chat', 'quiz']);
export type MicroTutorChatMode = z.infer<typeof MicroTutorChatMode>;

export const QuizSchema = z.object({
  type: z.enum(['single', 'multiple', 'matching', 'fill-in-blanks']),
  question: z.string(),
  topic: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  explanation: z.string().optional(),
  timeLimit: z.number().optional(),
  points: z.number(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).optional(),
  correctAnswers: z.array(z.string()).optional(),
  pairs: z.array(z.object({
    id: z.string(),
    left: z.string(),
    right: z.string(),
  })).optional(),
  text: z.string().optional(),
  blanks: z.array(z.object({
    id: z.string(),
    answer: z.string(),
    alternatives: z.array(z.string()).optional(),
  })).optional(),
});

export type Quiz = z.infer<typeof QuizSchema>;
