// Implementation of SuperMemo 2 algorithm for spaced repetition
interface ReviewItem {
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReview?: Date;
}

interface ReviewResponse {
  quality: 0 | 1 | 2 | 3 | 4 | 5; // 0 = complete blackout, 5 = perfect response
}

export class SpacedRepetition {
  static readonly MINIMUM_EASE_FACTOR = 1.3;

  static calculateNextReview(item: ReviewItem, response: ReviewResponse): ReviewItem {
    const { quality } = response;
    let { easeFactor, interval, repetitions } = item;

    // Calculate new ease factor
    easeFactor = Math.max(
      SpacedRepetition.MINIMUM_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Calculate next interval
    let nextInterval: number;
    if (quality < 3) {
      // If response was poor, reset repetitions
      repetitions = 0;
      nextInterval = 1;
    } else {
      // If response was good, increment repetitions and calculate next interval
      repetitions += 1;
      if (repetitions === 1) {
        nextInterval = 1;
      } else if (repetitions === 2) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(interval * easeFactor);
      }
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

    return {
      ...item,
      easeFactor,
      interval: nextInterval,
      repetitions,
      lastReview: now,
      nextReview,
    };
  }

  static getInitialReviewItem(id: string): ReviewItem {
    return {
      id,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date(),
    };
  }

  static getDueItems(items: ReviewItem[]): ReviewItem[] {
    const now = new Date();
    return items.filter(item => item.nextReview <= now);
  }
}
