
"use client";

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  initialTopic?: string;
}

export function QuizModal({ isOpen, onClose, userProfile, initialTopic = "" }: QuizModalProps) {
  const [quizType, setQuizType] = useState<string>("multiple");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [topicCategory, setTopicCategory] = useState<string>("");
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
    resetProgress,
    loadStats
  } = useQuizStore();
  const { toast } = useToast();

   useEffect(() => {
    if (isOpen && userProfile?.quizStats) {
      loadStats(userProfile.quizStats);
    }
  }, [isOpen, userProfile, loadStats]);

  const saveQuizStatsToFirestore = async (stats: QuizStatistics) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userDocRef, { quizStats: stats }, { merge: true });
  };


  const generateQuizzes = async () => {
    let currentTopic = "General Knowledge";
    if (topicCategory === 'skills' && userProfile.skills) {
      currentTopic = userProfile.skills;
    } else if (topicCategory === 'milestones' && userProfile.completedMilestones?.length) {
      // Format milestones into a string for the AI
      const milestoneTopics = userProfile.savedRoadmaps.flatMap((roadmap: any) => 
        Object.entries(roadmap.completedMilestones).flatMap(([stepIndex, milestones]: [string, any]) => 
          Object.keys(milestones).map(milestoneIndex => roadmap.roadmap[stepIndex]?.milestones[milestoneIndex])
        )
      ).filter(Boolean);
      currentTopic = milestoneTopics.join(', ') || "General Knowledge";
    } else if (topicCategory === 'custom' && topic.trim()) {
       currentTopic = topic.trim();
    } else if (!topicCategory) {
        toast({
            variant: "destructive",
            title: "Topic Required",
            description: "Please select a category or enter a custom topic.",
        });
        return;
    }
    

    setIsGenerating(true);
    resetProgress(); // Reset store before generating new quiz
    setShowResults(false);

    try {
      const questions: QuizData[] = [];
      // Use a set to track unique questions to avoid duplicates
      const questionTexts = new Set<string>();

      const promises = Array.from({ length: numQuestions }, () => 
        microTutorChat({
          userProfile: `Skills: ${userProfile.skills}, Interests: ${userProfile.interests}, Education: ${userProfile.education}`,
          careerGoal: userProfile.savedRoadmaps?.[0]?.career || "Not specified",
          currentProgress: `Generate a ${quizType} quiz question about: ${currentTopic}. Ensure the question is unique.`,
          mode: 'quiz',
          conversationHistory: JSON.stringify([]),
          savedRoadmaps: JSON.stringify([]),
          completedMilestones: JSON.stringify(userProfile.completedMilestones || [])
        })
      );
      
      const results = await Promise.all(promises);
      
      for(const result of results) {
          if (result.quiz) {
              const transformedQuiz = transformQuiz(result.quiz);
              if (transformedQuiz && !questionTexts.has(transformedQuiz.question)) {
                questions.push(transformedQuiz);
                questionTexts.add(transformedQuiz.question);
              }
          }
      }
      
      if (questions.length === 0) {
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "Unable to generate any valid quiz questions. The AI might be having trouble with the topic. Please try a different topic or try again later.",
        });
        setIsGenerating(false);
        return;
      }

      setStoreQuizzes(questions);
      setCurrentQuestionIndex(0);
      toast({
        title: 'Quiz Ready!',
        description: `Generated ${questions.length} questions. Good luck!`,
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

  const handleAnswerSubmit = (quiz: QuizData, answer: any) => {
    let isCorrect = false;

    if (isMultipleChoiceQuiz(quiz)) {
      isCorrect = quiz.correctAnswers.length === answer.length && quiz.correctAnswers.every((a:any) => answer.includes(a));
    } else if (isMatchingQuiz(quiz)) {
      isCorrect = answer.every((match: { leftId: string, rightId: string }) => {
        const pair = quiz.pairs.find(p => p.id === match.leftId);
        return pair && match.rightId === pair.id;
      });
    } else if (isFillInBlanksQuiz(quiz)) {
      isCorrect = answer.every((ans: { id: string, answer: string }) => {
        const blank = quiz.blanks.find(b => b.id === ans.id);
        return blank && (
          blank.answer.toLowerCase() === ans.answer.toLowerCase() ||
          blank.alternatives?.some(alt => alt.toLowerCase() === ans.answer.toLowerCase())
        );
      });
    }

    addAnswer({ answer, isCorrect });

    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question answered, show results.
      const correctCount = [...answers, { answer, isCorrect }].filter(a => a.isCorrect).length;
      
      const statsTopic = topic || 'General'; // Use a default topic if empty

      const newStats: QuizStatistics = {
        totalQuestions: quizStats.totalQuestions + quizzes.length,
        correctAnswers: quizStats.correctAnswers + correctCount,
        streakCount: correctCount === quizzes.length ? quizStats.streakCount + 1 : 0,
        questionsPerTopic: {
          ...quizStats.questionsPerTopic,
          [statsTopic]: {
            total: (quizStats.questionsPerTopic[statsTopic]?.total || 0) + quizzes.length,
            correct: (quizStats.questionsPerTopic[statsTopic]?.correct || 0) + correctCount
          }
        }
      };
      
      updateStats(newStats);
      saveQuizStatsToFirestore(newStats);
      setShowResults(true);
    }
  };


  const resetQuiz = () => {
    resetProgress();
    if(userProfile.quizStats) {
      loadStats(userProfile.quizStats);
    }
    setShowResults(false);
    setTopic(initialTopic);
    setTopicCategory("");
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
    return <p className="text-destructive">Error: Could not render quiz question.</p>;
  };

  const handleCloseQuiz = () => {
    const hasProgress = quizzes.length > 0 && !showResults && answers.length > 0;
    if (hasProgress) {
        if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) {
            resetProgress();
            onClose();
        }
    } else {
        resetProgress();
        onClose();
    }
  };

  const finalTopic = topicCategory === 'custom' ? topic : 
                     topicCategory === 'skills' ? userProfile.skills : 
                     topicCategory === 'milestones' ? userProfile.completedMilestones?.join(', ') : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleCloseQuiz();
      }
    }}>
      <DialogContent 
        className="max-w-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Quiz Mode</DialogTitle>
          <DialogDescription>
            Test your knowledge with interactive quizzes customized to your learning path.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!quizzes.length && !showResults ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz Type</label>
                  <Select value={quizType} onValueChange={setQuizType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple">Multiple Choice</SelectItem>
                      <SelectItem value="single">Single Answer</SelectItem>
                      <SelectItem value="matching">Matching</SelectItem>
                      <SelectItem value="fill-in-blanks">Fill in the Blanks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Questions</label>
                  <Select value={String(numQuestions)} onValueChange={(val) => setNumQuestions(Number(val))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Topic Category</label>
                <Select value={topicCategory} onValueChange={setTopicCategory}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skills" disabled={!userProfile.skills}>My Skills</SelectItem>
                    <SelectItem value="milestones" disabled={userProfile.completedMilestones?.length === 0}>Completed Milestones</SelectItem>
                    <SelectItem value="custom">Custom Topic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {topicCategory === 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Topic</label>
                  <Input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Python Data Structures"
                  />
                </div>
              )}

              <Button 
                onClick={generateQuizzes} 
                disabled={isGenerating || !topicCategory || (topicCategory === 'custom' && !topic.trim())}
                className="w-full"
              >
                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Start Quiz"}
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
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {quizzes.length}</span>
                <Progress 
                  value={((currentQuestionIndex + 1) / quizzes.length) * 100}
                  className="w-1/2"
                />
              </div>
              {renderCurrentQuiz()}
              {/* The submit button is now within each quiz component */}
              <Button 
                variant="ghost"
                onClick={handleCloseQuiz}
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
