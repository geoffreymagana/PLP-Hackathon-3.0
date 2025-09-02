import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
}

interface FlashcardProps {
  cards: Flashcard[];
  onComplete?: () => void;
}

export function Flashcards({ cards, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const isComplete = reviewedCards.size === cards.length;

  const flipCard = () => setIsFlipped(!isFlipped);

  const nextCard = () => {
    if (currentCard) {
      setReviewedCards(prev => new Set(prev.add(currentCard.id)));
    }
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
    if (isLastCard && isComplete && onComplete) {
      onComplete();
    }
  };

  const previousCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCards(new Set());
  };

  if (!currentCard) return null;

  return (
    <div className="space-y-4">
      <div 
        className="perspective-1000 cursor-pointer relative min-h-[200px]"
        onClick={flipCard}
      >
        <div
          className={cn(
            "w-full transform-gpu transition-transform duration-500",
            isFlipped ? "rotate-y-180" : ""
          )}
        >
          <Card className={cn(
            "absolute inset-0 backface-hidden p-6",
            !isFlipped ? "visible" : "invisible"
          )}>
            <CardContent className="flex items-center justify-center h-full text-center">
              {currentCard.front}
            </CardContent>
          </Card>

          <Card className={cn(
            "absolute inset-0 backface-hidden p-6 rotate-y-180",
            isFlipped ? "visible" : "invisible"
          )}>
            <CardContent className="flex items-center justify-center h-full text-center">
              {currentCard.back}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={previousCard}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm text-center space-x-2">
          <span className="text-muted-foreground">
            {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-muted-foreground">
            ({Math.round((reviewedCards.size / cards.length) * 100)}% complete)
          </span>
        </div>

        {isComplete ? (
          <Button
            variant="outline"
            size="icon"
            onClick={restart}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
