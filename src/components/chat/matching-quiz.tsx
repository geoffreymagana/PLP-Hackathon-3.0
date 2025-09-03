
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MatchingQuizProps {
  pairs: { id: string; left: string; right: string; }[];
  onSubmit: (matches: { leftId: string; rightId: string; }[]) => void;
  timeLimit?: number;
}

export function MatchingQuiz({ pairs, onSubmit, timeLimit }: MatchingQuizProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Map<string, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shuffle right options
  const [shuffledRight] = useState(() => {
    return [...pairs].sort(() => Math.random() - 0.5);
  });

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

  const handleLeftClick = (id: string) => {
    if (matches.has(id)) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (!selectedLeft || matches.has(selectedLeft)) return;
    
    const newMatches = new Map(matches.set(selectedLeft, id));
    setMatches(newMatches);
    setSelectedLeft(null);

    // This was the bug: checking before state update is complete.
    // Let's check size after potential update.
    if (newMatches.size === pairs.length) {
      // Auto-submit when all pairs are matched
      handleSubmit(newMatches);
    }
  };

  const handleSubmit = (currentMatches = matches) => {
    setIsSubmitting(true);
    const matchArray = Array.from(currentMatches.entries()).map(([leftId, rightId]) => ({
      leftId,
      rightId,
    }));
    onSubmit(matchArray);
  };

  return (
    <div className="space-y-6">
      {timeLimit && (
        <div className="text-sm text-muted-foreground text-right">
          Time remaining: {timeLeft}s
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          {pairs.map((pair) => (
            <Card
              key={pair.id}
              className={cn(
                "p-4 cursor-pointer transition-colors",
                selectedLeft === pair.id && "border-primary ring-2 ring-primary",
                matches.has(pair.id) && "opacity-50 cursor-not-allowed bg-muted",
              )}
              onClick={() => handleLeftClick(pair.id)}
            >
              {pair.left}
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          {shuffledRight.map((pair) => (
            <Card
              key={pair.id}
              className={cn(
                "p-4 cursor-pointer transition-colors",
                Array.from(matches.values()).includes(pair.id) && "opacity-50 cursor-not-allowed bg-muted"
              )}
              onClick={() => handleRightClick(pair.id)}
            >
              {pair.right}
            </Card>
          ))}
        </div>
      </div>

      <Button 
        className="w-full" 
        onClick={() => handleSubmit()}
        disabled={matches.size !== pairs.length || isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Matches
      </Button>
    </div>
  );
}
