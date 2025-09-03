
import type { QuizData, MultipleChoiceQuizData, MatchingQuizData, FillInBlanksQuizData } from '@/types/quiz';

export function isMultipleChoiceQuiz(quiz: QuizData): quiz is MultipleChoiceQuizData {
  return quiz.type === 'single' || quiz.type === 'multiple';
}

export function isMatchingQuiz(quiz: QuizData): quiz is MatchingQuizData {
  return quiz.type === 'matching';
}

export function isFillInBlanksQuiz(quiz: QuizData): quiz is FillInBlanksQuizData {
  return quiz.type === 'fill-in-blanks';
}

export function transformQuiz(quiz: any): QuizData | null {
  if (!quiz || typeof quiz !== 'object') return null;

  const baseQuiz = {
    question: String(quiz.question || ''),
    topic: String(quiz.topic || 'General'),
    difficulty: quiz.difficulty || 'beginner',
    explanation: quiz.explanation,
    timeLimit: quiz.timeLimit,
    points: Number(quiz.points || 1)
  };

  if (quiz.type === 'matching' && Array.isArray(quiz.pairs) && quiz.pairs.length > 0) {
    return {
      ...baseQuiz,
      type: 'matching',
      pairs: quiz.pairs.map((p: any) => ({
        id: String(p.id || Math.random().toString(36).substring(2)),
        left: String(p.left || ''),
        right: String(p.right || '')
      }))
    } as MatchingQuizData;
  }
  
  if ((quiz.type === 'fill-in-blanks' || quiz.type === 'fill-in-the-blanks') && quiz.text && Array.isArray(quiz.blanks) && quiz.blanks.length > 0) {
    return {
      ...baseQuiz,
      type: 'fill-in-blanks',
      text: String(quiz.text),
      blanks: quiz.blanks.map((b: any) => ({
        id: String(b.id || Math.random().toString(36).substring(2)),
        answer: String(b.answer || ''),
        alternatives: Array.isArray(b.alternatives) ? b.alternatives.map(String) : []
      }))
    } as FillInBlanksQuizData;
  }
  
  if ((quiz.type === 'single' || quiz.type === 'multiple' || quiz.type === 'multiple-choice' || quiz.type === 'single-answer') && Array.isArray(quiz.options) && Array.isArray(quiz.correctAnswers) && quiz.options.length > 0) {
    return {
      ...baseQuiz,
      type: quiz.type.startsWith('single') ? 'single' : 'multiple',
      options: quiz.options.map((opt: any) => ({
        id: String(opt.id || Math.random().toString(36).substring(2)),
        text: String(opt.text || '')
      })),
      correctAnswers: quiz.correctAnswers.map(String)
    } as MultipleChoiceQuizData;
  }
  
  return null;
}
