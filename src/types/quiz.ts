export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface MatchingOption {
  id: string;
  left: string;
  right: string;
}

export interface BaseQuizData {
  question: string;
  topic?: string;
  difficulty: QuizDifficulty;
  explanation?: string;
  timeLimit?: number;
  points: number;
}

export interface MultipleChoiceQuizData extends BaseQuizData {
  type: 'single' | 'multiple';
  options: { id: string; text: string }[];
  correctAnswers: string[];
}

export interface MatchingQuizData extends BaseQuizData {
  type: 'matching';
  pairs: MatchingOption[];
}

export interface FillInBlanksQuizData extends BaseQuizData {
  type: 'fill-in-blanks';
  text: string;
  blanks: { id: string; answer: string; alternatives?: string[] }[];
}

export type QuizData = MultipleChoiceQuizData | MatchingQuizData | FillInBlanksQuizData;

export interface QuizStatistics {
  totalQuestions: number;
  correctAnswers: number;
  questionsPerTopic: Record<string, { total: number; correct: number }>;
  streakCount: number;
}
