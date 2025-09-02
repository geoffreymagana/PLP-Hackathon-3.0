import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  questionsPerTopic: Record<string, { total: number; correct: number }>;
  averageTime?: number;
  streakCount: number;
}

interface QuizStatsProps {
  stats: QuizStats;
}

export function QuizStats({ stats }: QuizStatsProps) {
  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Accuracy</span>
            <span className="text-sm text-muted-foreground">{accuracy}%</span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Total Questions: {stats.totalQuestions}</p>
          <p className="text-sm font-medium">Correct Answers: {stats.correctAnswers}</p>
          <p className="text-sm font-medium">Current Streak: {stats.streakCount}</p>
          {stats.averageTime && (
            <p className="text-sm font-medium">
              Average Response Time: {Math.round(stats.averageTime)}s
            </p>
          )}
        </div>

        {Object.entries(stats.questionsPerTopic).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Performance by Topic</h4>
            {Object.entries(stats.questionsPerTopic).map(([topic, data]) => (
              <div key={topic}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{topic}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((data.correct / data.total) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(data.correct / data.total) * 100} 
                  className="h-1.5" 
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
