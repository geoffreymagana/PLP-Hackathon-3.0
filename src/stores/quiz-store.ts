
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizData, QuizStatistics } from '@/types/quiz';

interface Answer {
  answer: any;
  isCorrect: boolean;
}

interface QuizStore {
  quizzes: QuizData[];
  answers: Answer[];
  currentQuestionIndex: number;
  stats: QuizStatistics;
  setQuizzes: (quizzes: QuizData[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (answer: Answer) => void;
  updateStats: (newStats: Partial<QuizStatistics>) => void;
  loadStats: (stats: QuizStatistics) => void;
  resetProgress: () => void;
}

const initialStats: QuizStatistics = {
  totalQuestions: 0,
  correctAnswers: 0,
  questionsPerTopic: {},
  streakCount: 0
};

const initialState = {
  quizzes: [],
  answers: [],
  currentQuestionIndex: 0,
  stats: initialStats,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...initialState,
      setQuizzes: (quizzes) => set({ quizzes, answers: [], currentQuestionIndex: 0 }),
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      addAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers, answer]
        })),
      updateStats: (newStats) =>
        set((state) => ({
          stats: { ...state.stats, ...newStats }
        })),
      loadStats: (stats) => set({ stats }),
      resetProgress: () => set(initialState)
    }),
    {
      name: 'quiz-progress'
    }
  )
);
