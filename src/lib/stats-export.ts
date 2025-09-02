import { saveAs } from 'file-saver';
import { QuizStats } from '@/components/chat/quiz-stats';

export function exportQuizStats(stats: QuizStats) {
  const data = JSON.stringify(stats, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  saveAs(blob, `quiz-stats-${new Date().toISOString().split('T')[0]}.json`);
}

export async function importQuizStats(file: File): Promise<QuizStats> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const stats = JSON.parse(event.target?.result as string);
        // Validate the imported data
        if (!isValidQuizStats(stats)) {
          throw new Error('Invalid quiz statistics format');
        }
        resolve(stats);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function isValidQuizStats(stats: any): stats is QuizStats {
  return (
    typeof stats === 'object' &&
    typeof stats.totalQuestions === 'number' &&
    typeof stats.correctAnswers === 'number' &&
    typeof stats.streakCount === 'number' &&
    typeof stats.questionsPerTopic === 'object'
  );
}
