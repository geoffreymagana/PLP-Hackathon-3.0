import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizData, QuizStatistics } from '@/types/quiz';

interface QuizProgress {
  answeredQuestions: Record<string, boolean>;
  currentQuestionIndex: number;
  quizzes: QuizData[];
  answers: any[];
  stats: QuizStatistics;
}

interface QuizStore extends QuizProgress {
  setQuizzes: (quizzes: QuizData[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  markQuestionAnswered: (questionId: string) => void;
  addAnswer: (answer: any) => void;
  updateStats: (stats: Partial<QuizStatistics>) => void;
  resetProgress: () => void;
}

const initialStats: QuizStatistics = {
  totalQuestions: 0,
  correctAnswers: 0,
  questionsPerTopic: {},
  streakCount: 0
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      answeredQuestions: {},
      currentQuestionIndex: 0,
      quizzes: [],
      answers: [],
      stats: initialStats,
      setQuizzes: (quizzes) => set({ quizzes, currentQuestionIndex: 0, answers: [], answeredQuestions: {} }),
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      markQuestionAnswered: (questionId) => 
        set((state) => ({
          answeredQuestions: { ...state.answeredQuestions, [questionId]: true }
        })),
      addAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers, answer]
        })),
      updateStats: (newStats) =>
        set((state) => ({
          stats: { ...state.stats, ...newStats }
        })),
      resetProgress: () => 
        set({
          answeredQuestions: {},
          currentQuestionIndex: 0,
          quizzes: [],
          answers: [],
          stats: initialStats
        })
    }),
    {
      name: 'quiz-progress'
    }
  )
);
