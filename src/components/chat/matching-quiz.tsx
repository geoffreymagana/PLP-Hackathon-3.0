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
  }, [timeLimit]);

  const handleLeftClick = (id: string) => {
    if (matches.has(id)) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (!selectedLeft || matches.has(selectedLeft)) return;
    
    setMatches(new Map(matches.set(selectedLeft, id)));
    setSelectedLeft(null);

    // Check if all pairs are matched
    if (matches.size === pairs.length - 1) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const matchArray = Array.from(matches.entries()).map(([leftId, rightId]) => ({
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
                selectedLeft === pair.id && "border-primary",
                matches.has(pair.id) && "opacity-50",
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
                Array.from(matches.values()).includes(pair.id) && "opacity-50"
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
        onClick={handleSubmit}
        disabled={matches.size !== pairs.length || isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Matches
      </Button>
    </div>
  );
}
