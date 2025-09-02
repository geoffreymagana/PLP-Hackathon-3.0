"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Quiz } from './quiz';
import { MatchingQuiz } from './matching-quiz';
import { FillInBlanksQuiz } from './fill-in-blanks-quiz';
import { QuizStats } from './quiz-stats';
import { microTutorChat } from '@/ai/flows/ai-micro-tutor';
import { useQuizStore } from '@/stores/quiz-store';
import type { MicroTutorChatOutput } from '@/ai/flows/ai-micro-tutor';
import type { QuizData, MultipleChoiceQuizData, MatchingQuizData, FillInBlanksQuizData, QuizStatistics } from '@/types/quiz';
import { transformQuiz, isMatchingQuiz, isFillInBlanksQuiz, isMultipleChoiceQuiz } from '@/utils/quiz-helpers';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  initialTopic?: string;
}

export function QuizModal({ isOpen, onClose, userProfile, initialTopic = "" }: QuizModalProps) {
  const [quizType, setQuizType] = useState<string>("multiple-choice");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  const {
    quizzes,
    answers,
    currentQuestionIndex,
    stats: quizStats,
    setQuizzes: setStoreQuizzes,
    setCurrentQuestionIndex,
    addAnswer,
    updateStats,
    resetProgress
  } = useQuizStore();
  const { toast } = useToast();

  const mapQuizType = (type: string): string => {
    switch (type) {
      case 'multiple-choice':
        return 'multiple';
      case 'single-answer':
        return 'single';
      case 'fill-in-the-blanks':
        return 'fill-in-blanks';
      default:
        return type;
    }
  };

  const generateQuizzes = async () => {
    // Check if user has completed milestones when trying to quiz on milestones
    if (topic === userProfile.completedMilestones?.join(", ") && 
        (!userProfile.completedMilestones || userProfile.completedMilestones.length === 0)) {
      toast({
        variant: "destructive",
        title: "No Completed Milestones",
        description: "You need to complete some milestones before taking quizzes about them.",
      });
      return;
    }

    setIsGenerating(true);
    setStoreQuizzes([]);
    setShowResults(false);

    try {
      const questions = [];
      // Keep track of consecutive failures
      let consecutiveFailures = 0;
      const maxFailures = 3;

      while (questions.length < numQuestions && consecutiveFailures < maxFailures) {
        try {
          const result: MicroTutorChatOutput = await microTutorChat({
            userProfile: `Skills: ${userProfile.skills}, Interests: ${userProfile.interests}, Education: ${userProfile.education}`,
            careerGoal: userProfile.savedRoadmaps?.[0]?.career || "Not specified",
            currentProgress: `Generate a ${mapQuizType(quizType)} quiz about: ${topic}`,
            mode: 'quiz',
            conversationHistory: JSON.stringify([]),
            savedRoadmaps: JSON.stringify([]),
            completedMilestones: JSON.stringify(userProfile.completedMilestones || [])
          });

          if (result.quiz) {
            const transformedQuiz = transformQuiz(result.quiz);
            if (transformedQuiz) {
              // Validate quiz data based on type
              if (
                (transformedQuiz.type === 'fill-in-blanks' && transformedQuiz.text && Array.isArray(transformedQuiz.blanks)) ||
                (transformedQuiz.type === 'matching' && Array.isArray(transformedQuiz.pairs)) ||
                (isMultipleChoiceQuiz(transformedQuiz) && Array.isArray(transformedQuiz.options))
              ) {
                questions.push(transformedQuiz);
                consecutiveFailures = 0; // Reset failures on success
                continue;
              }
            }
          }
          // If we get here, the quiz wasn't valid
          consecutiveFailures++;
        } catch (err) {
          console.error('Error generating quiz question:', err);
          consecutiveFailures++;
        }
        
        // If we've failed too many times in a row, show a warning
        if (consecutiveFailures >= maxFailures) {
          toast({
            variant: "destructive",
            title: "Quiz Generation Issues",
            description: `Some questions could not be generated. Only ${questions.length} out of ${numQuestions} questions are available.`,
          });
        }
      }

      if (questions.length === 0) {
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "Unable to generate valid quiz questions. Please try again with different settings.",
        });
        return;
      }

      // Set quizzes into store and reset question index
      setStoreQuizzes(questions);
      setCurrentQuestionIndex(0);
      toast({
        title: 'Quiz Ready',
        description: `Generated ${questions.length} question${questions.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Quiz Generation Failed",
        description: "There was a problem generating the quiz. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSubmit = async (quiz: QuizData, answer: any) => {
    // Initial validation
    if (!Array.isArray(answer)) {
      console.error('Invalid answer format');
      toast({
        variant: "destructive",
        title: "Invalid Answer",
        description: "Please provide a valid answer before submitting.",
      });
      return;
    }

    // Use type guards to ensure type safety and validate answers
    let isCorrect = false;
    let isValidFormat = true;

    if (isMultipleChoiceQuiz(quiz)) {
      // Check that the selected answers exist in the options
      const validAnswers = answer.every(a => quiz.options.some(opt => opt.id === a));
      if (!validAnswers) {
        isValidFormat = false;
        toast({
          variant: "destructive",
          title: "Invalid Answer",
          description: "Please select valid answer options.",
        });
      } else {
        isCorrect = quiz.correctAnswers.length === answer.length &&
          quiz.correctAnswers.every(a => answer.includes(a));
      }
    } else if (isMatchingQuiz(quiz)) {
      // Check that all pairs are matched and IDs exist
      const validPairs = answer.every((match: { leftId: string, rightId: string }) => {
        const leftExists = quiz.pairs.some(p => p.id === match.leftId);
        const rightExists = quiz.pairs.some(p => p.id === match.rightId);
        return leftExists && rightExists;
      });

      if (!validPairs) {
        isValidFormat = false;
        toast({
          variant: "destructive",
          title: "Invalid Matches",
          description: "Please match all items before submitting.",
        });
      } else {
        isCorrect = answer.every((match: { leftId: string, rightId: string }) => {
          const pair = quiz.pairs.find(p => p.id === match.leftId);
          return pair && match.rightId === pair.id;
        });
      }
    } else if (isFillInBlanksQuiz(quiz)) {
      // Check that all blanks are filled and IDs exist
      const validBlanks = answer.every((ans: { id: string, answer: string }) => {
        const blankExists = quiz.blanks.some(b => b.id === ans.id);
        const hasAnswer = typeof ans.answer === 'string' && ans.answer.trim().length > 0;
        return blankExists && hasAnswer;
      });

      if (!validBlanks) {
        isValidFormat = false;
        toast({
          variant: "destructive",
          title: "Incomplete Answer",
          description: "Please fill in all blanks before submitting.",
        });
      } else {
        isCorrect = answer.every((ans: { id: string, answer: string }) => {
          const blank = quiz.blanks.find(b => b.id === ans.id);
          return blank && (
            blank.answer.toLowerCase() === ans.answer.toLowerCase() ||
            blank.alternatives?.some(alt => alt.toLowerCase() === ans.answer.toLowerCase())
          );
        });
      }
    }

    if (!isValidFormat) {
      return; // Don't proceed if the format is invalid
    }

    // Batch state updates by combining them
    const answerObj = { answer, isCorrect };
    addAnswer(answerObj);

    if (currentQuestionIndex + 1 < quizzes.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      // Update quiz statistics
      const topic = quiz.topic || 'General';
      const correctCount = answers.filter(a => a.isCorrect).length;
      
      updateStats({
        totalQuestions: quizStats.totalQuestions + quizzes.length,
        correctAnswers: quizStats.correctAnswers + correctCount,
        streakCount: correctCount === quizzes.length ? quizStats.streakCount + 1 : 0,
        questionsPerTopic: {
          ...quizStats.questionsPerTopic,
          [topic]: {
            total: (quizStats.questionsPerTopic[topic]?.total || 0) + quizzes.length,
            correct: (quizStats.questionsPerTopic[topic]?.correct || 0) + correctCount
          }
        }
      });
    }
  };

  const resetQuiz = () => {
    resetProgress();
    setShowResults(false);
  };

  const renderCurrentQuiz = () => {
    if (!quizzes.length || currentQuestionIndex >= quizzes.length) return null;
    
    const currentQuiz = quizzes[currentQuestionIndex];
    if (!currentQuiz) return null;
    
    switch (currentQuiz.type) {
      case 'matching':
        if (isMatchingQuiz(currentQuiz)) {
          return (
            <MatchingQuiz
              pairs={currentQuiz.pairs}
              onSubmit={(matches) => handleAnswerSubmit(currentQuiz, matches)}
            />
          );
        }
        break;
      case 'fill-in-blanks':
        if (isFillInBlanksQuiz(currentQuiz)) {
          return (
            <FillInBlanksQuiz
              text={currentQuiz.text || ''}
              blanks={currentQuiz.blanks || []}
              onSubmit={(answers) => handleAnswerSubmit(currentQuiz, answers)}
            />
          );
        }
        break;
      default:
        return (
          <Quiz
            question={{
              id: `quiz-${currentQuestionIndex}`,
              ...currentQuiz as MultipleChoiceQuizData
            }}
            onSubmit={(answers) => handleAnswerSubmit(currentQuiz, answers)}
          />
        );
    }
  };

  const handleCloseQuiz = () => {
    const hasProgress = quizzes.length > 0 && !showResults && answers.length < quizzes.length;

    if (!hasProgress) {
      // No quiz in progress, close immediately
      resetProgress();
      onClose();
      return;
    }

    // Confirm before closing if there's a quiz in progress
    const shouldCancel = window.confirm(
      `Are you sure you want to cancel this quiz? You've completed ${answers.length} out of ${quizzes.length} questions. Your progress will be lost.`
    );
    
    if (shouldCancel) {
      resetProgress();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleCloseQuiz();
      }
    }}>
      <DialogContent 
        className="max-w-4xl h-[80vh]" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Quiz Mode</DialogTitle>
          <DialogDescription>
            Test your knowledge with interactive quizzes customized to your learning path
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!quizzes.length && !showResults ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz Type</label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="single-answer">Single Answer</option>
                  <option value="matching">Matching</option>
                  <option value="fill-in-the-blanks">Fill in the Blanks</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic Category</label>
                  <select
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                    onChange={(e) => {
                      const category = e.target.value;
                      if (category === "custom") {
                        setTopic("");
                      } else if (category === "skills") {
                        setTopic(userProfile.skills || "");
                      } else if (category === "milestone") {
                        setTopic(userProfile.completedMilestones?.join(", ") || "");
                      }
                    }}
                  >
                    <option value="">Select a category</option>
                    <option value="skills">My Skills</option>
                    <option value="milestone">Completed Milestones</option>
                    <option value="custom">Custom Topic</option>
                  </select>
                </div>

                {topic === "" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Topic</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter quiz topic..."
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={generateQuizzes} 
                disabled={isGenerating || !topic}
                className="w-full"
              >
                {isGenerating ? "Generating Quiz..." : "Start Quiz"}
              </Button>
              <Button 
                variant="ghost"
                onClick={handleCloseQuiz}
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </>
          ) : showResults ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quiz Results</h3>
              <Progress 
                value={(answers.filter(a => a.isCorrect).length / answers.length) * 100} 
              />
              <p className="text-center">
                You got {answers.filter(a => a.isCorrect).length} out of {answers.length} correct!
              </p>
              <QuizStats stats={quizStats} />
              <Button onClick={resetQuiz} className="w-full">
                Start New Quiz
              </Button>
              <Button 
                variant="ghost"
                onClick={handleCloseQuiz}
                className="w-full mt-2"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Question {currentQuestionIndex + 1} of {quizzes.length}</span>
                <Progress 
                  value={((currentQuestionIndex + 1) / quizzes.length) * 100}
                  className="w-1/2"
                />
              </div>
              {renderCurrentQuiz()}
              <Button 
                variant="ghost"
                onClick={() => {
                  const shouldCancel = window.confirm("Are you sure you want to cancel this quiz? Your progress will be lost.");
                  if (shouldCancel) {
                    resetProgress();
                    onClose();
                  }
                }}
                className="w-full mt-4"
              >
                Cancel Quiz
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
