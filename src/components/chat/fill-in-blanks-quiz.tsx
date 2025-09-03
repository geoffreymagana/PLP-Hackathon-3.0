
import { useState, useEffect, Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface FillInBlanksProps {
  text: string;
  blanks: { id: string; answer: string; alternatives?: string[] }[];
  onSubmit: (answers: { id: string; answer: string }[]) => void;
  timeLimit?: number;
}

export function FillInBlanksQuiz({ text, blanks, onSubmit, timeLimit }: FillInBlanksProps) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replace blank placeholders with input fields
  const parts = text.split(/\{(\d+)\}/);

  useEffect(() => {
    if (!timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft(time => {
        if (time === undefined || time <= 1) {
          handleSubmit();
          clearInterval(timer);
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimit]);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(new Map(answers.set(id, value)));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const answerArray = Array.from(answers.entries()).map(([id, answer]) => ({
      id,
      answer: answer.trim().toLowerCase(),
    }));
    onSubmit(answerArray);
  };

  return (
    <div className="space-y-6">
      {timeLimit && (
        <div className="text-sm text-muted-foreground text-right">
          Time remaining: {timeLeft}s
        </div>
      )}

      <div className="space-y-4">
        {parts.map((part, index) => {
           const key = `part-${index}`;
          if (index % 2 === 0) {
            // Text part
            return <span key={key}>{part}</span>;
          } else {
            // Input part
            const blankIndex = parseInt(part, 10);
            if(blanks && blanks[blankIndex]) {
              const blankId = blanks[blankIndex].id;
              return (
                <Fragment key={key}>
                    <Input
                    type="text"
                    value={answers.get(blankId) || ''}
                    onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                    className="w-32 inline-block mx-1"
                    disabled={isSubmitting}
                    />
                </Fragment>
              );
            }
            return null;
          }
        })}
      </div>

      <Button 
        className="w-full" 
        onClick={handleSubmit}
        disabled={answers.size !== blanks.length || isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Answers
      </Button>
    </div>
  );
}
