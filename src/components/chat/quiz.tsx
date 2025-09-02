import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer } from "lucide-react";

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: {
    id: string;
    text: string;
  }[];
  correctAnswers: string[];
  explanation?: string;
  timeLimit?: number; // in seconds
}

interface QuizProps {
  question: QuizQuestion;
  onSubmit: (answers: string[]) => void;
  showResults?: boolean;
  submitted?: boolean;
}

export function Quiz({ question, onSubmit, showResults = false, submitted = false }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Timer logic
  useEffect(() => {
    if (!question.timeLimit || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time === undefined || time <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question.timeLimit, submitted]);

  const handleSubmit = () => {
    if (submitted || !selectedAnswers || !Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
      console.warn('Invalid submission state:', { submitted, selectedAnswers });
      return;
    }
    
    const correct = question.type === 'single'
      ? selectedAnswers[0] === question.correctAnswers[0]
      : selectedAnswers.length === question.correctAnswers.length &&
        selectedAnswers.every(answer => question.correctAnswers.includes(answer));

    setIsCorrect(correct);
    onSubmit(selectedAnswers);
  };

  const handleSelect = (answerId: string) => {
    if (submitted) return;

    if (question.type === 'single') {
      setSelectedAnswers([answerId]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(answerId)
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId]
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {question.timeLimit && !submitted && (
          <div className="flex items-center justify-end mb-4 text-sm text-muted-foreground">
            <Timer className="w-4 h-4 mr-1" />
            {timeLeft}s
          </div>
        )}
        
        <div className="prose dark:prose-invert max-w-none mb-6">
          {question.question}
        </div>

        <div className="space-y-4">
          {question.type === 'single' ? (
            <RadioGroup
              disabled={submitted}
              value={selectedAnswers[0]}
              onValueChange={(value) => handleSelect(value)}
              className="space-y-2"
            >
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border ${
                    showResults
                      ? question.correctAnswers.includes(option.id)
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : selectedAnswers.includes(option.id)
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-transparent'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label className="flex-grow cursor-pointer" htmlFor={option.id}>
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border ${
                    showResults
                      ? question.correctAnswers.includes(option.id)
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : selectedAnswers.includes(option.id)
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-transparent'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedAnswers.includes(option.id)}
                    onCheckedChange={() => handleSelect(option.id)}
                    disabled={submitted}
                  />
                  <Label className="flex-grow cursor-pointer" htmlFor={option.id}>
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {!submitted && (
          <Button
            onClick={handleSubmit}
            className="w-full mt-6"
            disabled={selectedAnswers.length === 0}
          >
            Submit Answer
          </Button>
        )}

        {showResults && question.explanation && (
          <div className={`mt-6 p-4 rounded-lg ${
            isCorrect 
              ? 'bg-green-50 dark:bg-green-950/20 border border-green-500' 
              : 'bg-red-50 dark:bg-red-950/20 border border-red-500'
          }`}>
            <h4 className="font-medium mb-2">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            <p className="text-sm">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
