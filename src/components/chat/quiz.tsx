
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

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
}

export function Quiz({ question, onSubmit }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when the question ID changes
  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(question.timeLimit);
    setIsSubmitting(false);
  }, [question.id, question.timeLimit]);

  // Timer logic
  useEffect(() => {
    if (!question.timeLimit) return;

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
  }, [question.id, question.timeLimit]);

  const handleSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    onSubmit(selectedAnswers);
    // Don't reset state here, parent will trigger re-render with new question
  };

  const handleSelect = (answerId: string) => {
    if (isSubmitting) return;

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
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-none">
      <CardContent className="p-0">
        {question.timeLimit && (
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
              disabled={isSubmitting}
              value={selectedAnswers[0]}
              onValueChange={(value) => handleSelect(value)}
              className="space-y-2"
            >
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border",
                    "hover:bg-muted/50 cursor-pointer",
                    selectedAnswers.includes(option.id) && "border-primary bg-primary/10"
                  )}
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
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border",
                    "hover:bg-muted/50 cursor-pointer",
                    selectedAnswers.includes(option.id) && "border-primary bg-primary/10"
                  )}
                  onClick={() => handleSelect(option.id)}
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedAnswers.includes(option.id)}
                    disabled={isSubmitting}
                  />
                  <Label className="flex-grow cursor-pointer" htmlFor={option.id}>
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full mt-6"
          disabled={isSubmitting || selectedAnswers.length === 0}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Answer
        </Button>
      </CardContent>
    </Card>
  );
}
