
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Sparkles, ChevronDown, ChevronUp, Flame } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/chat/copy-button";
import { Quiz } from "@/components/chat/quiz";
import { MatchingQuiz } from "@/components/chat/matching-quiz";
import { FillInBlanksQuiz } from "@/components/chat/fill-in-blanks-quiz";
import { QuizModal } from "@/components/chat/quiz-modal";
import type { QuizData, MatchingQuizData, FillInBlanksQuizData, MultipleChoiceQuizData } from "@/types/quiz";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { microTutorChat } from "@/ai/flows/ai-micro-tutor";
import type { MicroTutorChatOutput } from "@/ai/flows/ai-micro-tutor";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendNewMessageNotification } from "@/services/notification-service";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";


const formSchema = z.object({
  currentProgress: z.string().min(1, "Message cannot be empty."),
});



interface FlashcardData {
  front: string;
  back: string;
  topic: string;
}

type MessageType = 'text' | 'code' | 'quiz' | 'flashcard' | 'stats';

type Message = {
  role: "user" | "ai";
  content: string;
  suggestedPrompts?: string[];
  quiz?: QuizData;
  flashcard?: FlashcardData;
  type?: MessageType;
  isAnswered?: boolean;
};

type UserProfile = {
  skills: string;
  interests: string;
  education: string;
  location: string;
  avatarUrl?: string;
  savedRoadmaps?: any[];
  completedMilestones?: string[];
  chatHistory?: Message[];
};

interface QuizStatistics {
  totalQuestions: number;
  correctAnswers: number;
  questionsPerTopic: Record<string, { total: number; correct: number }>;
  streakCount: number;
}

const AIAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
    <radialGradient id="oDvWy9qKGfkbPZViUk7TCa_eoxMN35Z6JKg_gr1" cx="-670.437" cy="617.13" r=".041" gradientTransform="matrix(128.602 652.9562 653.274 -128.6646 -316906.281 517189.719)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#1ba1e3"></stop>
      <stop offset="0" stopColor="#1ba1e3"></stop>
      <stop offset=".3" stopColor="#5489d6"></stop>
      <stop offset=".545" stopColor="#9b72cb"></stop>
      <stop offset=".825" stopColor="#d96570"></stop>
      <stop offset="1" stopColor="#f49c46"></stop>
    </radialGradient>
    <path fill="url(#oDvWy9qKGfkbPZViUk7TCa_eoxMN35Z6JKg_gr1)" d="M22.882,31.557l-1.757,4.024c-0.675,1.547-2.816,1.547-3.491,0l-1.757-4.024	c-1.564-3.581-4.378-6.432-7.888-7.99l-4.836-2.147c-1.538-0.682-1.538-2.919,0-3.602l4.685-2.08	c3.601-1.598,6.465-4.554,8.002-8.258l1.78-4.288c0.66-1.591,2.859-1.591,3.52,0l1.78,4.288c1.537,3.703,4.402,6.659,8.002,8.258	l4.685,2.08c1.538,0.682,1.538,2.919,0,3.602l-4.836,2.147C27.26,25.126,24.446,27.976,22.882,31.557z"></path>
    <radialGradient id="oDvWy9qKGfkbPZViUk7TCb_eoxMN35Z6JKg_gr2" cx="-670.437" cy="617.13" r=".041" gradientTransform="matrix(128.602 652.9562 653.274 -128.6646 -316906.281 517189.719)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#1ba1e3"></stop>
      <stop offset="0" stopColor="#1ba1e3"></stop>
      <stop offset=".3" stopColor="#5489d6"></stop>
      <stop offset=".545" stopColor="#9b72cb"></stop>
      <stop offset=".825" stopColor="#d96570"></stop>
      <stop offset="1" stopColor="#f49c46"></stop>
    </radialGradient>
    <path fill="url(#oDvWy9qKGfkbPZViUk7TCb_eoxMN35Z6JKg_gr2)" d="M39.21,44.246l-0.494,1.132	c-0.362,0.829-1.51,0.829-1.871,0l-0.494-1.132c-0.881-2.019-2.467-3.627-4.447-4.506l-1.522-0.676	c-0.823-0.366-0.823-1.562,0-1.928l1.437-0.639c2.03-0.902,3.645-2.569,4.511-4.657l0.507-1.224c0.354-0.853,1.533-0.853,1.886,0	l0.507,1.224c0.866,2.088,2.481,3.755,4.511,4.657l1.437,0.639c0.823,0.366,0.823,1.562,0,1.928l-1.522,0.676	C41.677,40.619,40.091,42.227,39.21,44.246z"></path>
  </svg>
);

const ChatSkeleton = () => (
  <div className="flex flex-col h-screen p-4 md:p-8">
    <header className="space-y-2 mb-8">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </header>
    <Card className="flex-1 flex flex-col">
      <CardContent className="p-6 flex-1 space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-lg" />
        </div>
      </CardContent>
      <div className="p-4 border-t bg-background">
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  </div>
);

const StreakDonut = ({ streak }: { streak: number }) => {
    const data = [
        { name: "streak", value: Math.min(streak, 10) }, // Cap at 10 for visualization
        { name: "empty", value: Math.max(10 - streak, 0) }
    ];
    return (
        <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={450}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="hsl(var(--muted))" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="h-8 w-8 text-orange-500"/>
                <span className="text-xl font-bold">{streak}</span>
            </div>
        </div>
    );
};


export default function CheckInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStatistics>({
    totalQuestions: 0,
    correctAnswers: 0,
    questionsPerTopic: {},
    streakCount: 0
  });
  const [quizMode, setQuizMode] = useState(false);
  const [isQuizPanelOpen, setIsQuizPanelOpen] = useState(true);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentProgress: "" },
  });

  const tutorThinkingMessages = {
    initial: [
      "Let me introduce myself...",
      "Getting ready to be your learning companion...",
      "Preparing to help you learn...",
    ],
    question: [
      "Let me think about that...",
      "That's a great question! Let me gather my thoughts...",
      "Interesting question! Let me break this down...",
      "Let me find the best way to explain this...",
    ],
    quiz: [
      "Preparing a question for you...",
      "Creating a quiz to test your knowledge...",
      "Let me think of a good challenge...",
      "Designing a learning exercise...",
    ],
    progress: [
      "Analyzing your progress...",
      "Looking at your learning journey...",
      "Reviewing your achievements...",
      "Thinking of the next steps for you...",
    ]
  } as const;

  useEffect(() => {
    if (isLoading) {
      let messageType: keyof typeof tutorThinkingMessages = 'progress';
      if (messages.length === 0) {
        messageType = 'initial';
      } else {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          if (lastMessage.content.toLowerCase().includes("quiz") || 
              lastMessage.content.toLowerCase().includes("test")) {
            messageType = 'quiz';
          } else if (lastMessage.content.includes("?")) {
            messageType = 'question';
          }
        }
      }
      const messageList = tutorThinkingMessages[messageType];
      const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
      setThinkingMessage(randomMessage);
    }
  }, [isLoading, messages, tutorThinkingMessages]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.chatHistory) {
            setMessages(profileData.chatHistory);
          }
        }
        setIsProfileLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handlePromptClick = (prompt: string) => {
    form.setValue("currentProgress", prompt);
    form.handleSubmit(onSubmit)();
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userDocRef, { chatHistory: updatedMessages }, { merge: true });
  };

  async function callMicroTutorChat(values: z.infer<typeof formSchema>, currentMessages: Message[]) {
    if (!userProfile) return;

    setIsLoading(true);
    setSuggestedPrompts([]);
    setShowSuggestions(false);

    try {
      const result: MicroTutorChatOutput = await microTutorChat({
        userProfile: `Skills: ${userProfile.skills}, Interests: ${userProfile.interests}, Education: ${userProfile.education}`,
        careerGoal: userProfile.savedRoadmaps?.[0]?.career || "Not specified",
        currentProgress: values.currentProgress,
        savedRoadmaps: JSON.stringify(userProfile.savedRoadmaps || []),
        completedMilestones: JSON.stringify(userProfile.completedMilestones || []),
        conversationHistory: JSON.stringify(currentMessages),
        mode: 'chat',
      });
      
      let newAIMessage: Message;
      if (quizMode && result.quiz) {
        const quiz = result.quiz as QuizData;
        newAIMessage = { 
          role: "ai", 
          content: result.response,
          type: "quiz",
          quiz: quiz,
          suggestedPrompts: result.suggestedPrompts 
        };
      } else {
        newAIMessage = { 
          role: "ai", 
          content: result.response,
          suggestedPrompts: result.suggestedPrompts 
        };
      }
      const updatedMessages = [...currentMessages, newAIMessage];

      setMessages(updatedMessages);
      setSuggestedPrompts(result.suggestedPrompts);
      setShowSuggestions(true);
      await saveChatHistory(updatedMessages);
      
      // Send notification for new AI message
      if(document.visibilityState !== 'visible') {
        sendNewMessageNotification();
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Tutor Failed",
        description: "There was a problem communicating with the AI. Please try again.",
      });
      setMessages(prev => prev.slice(0, -1)); // Remove the user message on error
    } finally {
      setIsLoading(false);
      form.reset();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newUserMessage: Message = { role: "user", content: values.currentProgress };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    await saveChatHistory(updatedMessages);
    await callMicroTutorChat(values, updatedMessages);
  }
  
    const handleQuizSubmit = async (quiz: QuizData, answers: any, messageIndex: number) => {
    // Prevent submitting already answered quizzes
    if (messages[messageIndex].isAnswered) {
      return;
    }

    let isCorrect = false;

    switch (quiz.type) {
      case 'single':
      case 'multiple':
        isCorrect = Array.isArray(answers) && quiz.correctAnswers.length === answers.length &&
          quiz.correctAnswers.every(a => answers.includes(a));
        break;
      case 'matching':
        isCorrect = Array.isArray(answers) && answers.every((match: { leftId: string, rightId: string }) => {
          const pair = (quiz as MatchingQuizData).pairs.find(p => p.id === match.leftId);
          return pair && match.rightId === pair.id;
        });
        break;
      case 'fill-in-blanks':
        isCorrect = Array.isArray(answers) && answers.every((answer: { id: string, answer: string }) => {
          const blank = (quiz as FillInBlanksQuizData).blanks.find(b => b.id === answer.id);
          return blank && (
            blank.answer.toLowerCase() === answer.answer.toLowerCase() ||
            blank.alternatives?.some(alt => alt.toLowerCase() === answer.answer.toLowerCase())
          );
        });
        break;
    }

    // Mark the quiz as answered
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      isAnswered: true
    };
    
    // Create new AI messages for feedback
    const feedbackMessages: Message[] = [];

    if (isCorrect) {
        feedbackMessages.push({
            role: "ai",
            content: "✅ Excellent! You got it right! Would you like to try another question?",
            type: 'text'
        });
    } else {
        feedbackMessages.push({
            role: "ai",
            content: "❌ Not quite right. Let's review this concept together.",
            type: 'text'
        });
        if (quiz.explanation) {
            feedbackMessages.push({
                role: "ai",
                content: quiz.explanation,
                type: 'text'
            });
        }
    }


    const messagesWithFeedback = [...updatedMessages, ...feedbackMessages];
    setMessages(messagesWithFeedback);
    await saveChatHistory(messagesWithFeedback);

    // Update quiz statistics
    setQuizStats(prev => {
      const topic = quiz.topic || 'General';
      const topicStats = prev.questionsPerTopic[topic] || { total: 0, correct: 0 };
      
      return {
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        streakCount: isCorrect ? prev.streakCount + 1 : 0,
        questionsPerTopic: {
          ...prev.questionsPerTopic,
          [topic]: {
            total: topicStats.total + 1,
            correct: topicStats.correct + (isCorrect ? 1 : 0)
          }
        }
      };
    });
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.setValue('currentProgress', e.target.value);
    if(e.target.value.length > 0) {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Initial message call
  useEffect(() => {
    if (!isProfileLoading && userProfile && messages.length === 0) {
      callMicroTutorChat({ currentProgress: "Hello! Please greet me and start our session." }, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileLoading, userProfile]);

  if (isProfileLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex h-screen">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 md:hidden">
                  <h1 className="text-xl font-bold font-headline">CHAT AMT</h1>
                  <Button variant="outline" size="sm" onClick={() => setShowQuizModal(true)}>
                      Start Quiz
                  </Button>
              </div>
              {/* Desktop Header */}
              <div className="hidden md:block p-8">
                  <h1 className="text-3xl font-bold tracking-tight font-headline">AI-Micro-Tutor (Chat AMT)</h1>
                  <p className="text-muted-foreground">Chat with your AI coach to get answers and refine your roadmap.</p>
              </div>
          </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-28 md:pb-8" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <div 
            key={`message-${message.role}-${index}-${message.content.slice(0, 10)}`} 
            className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'ai' && (
              <Avatar className="bg-transparent text-accent-foreground shrink-0">
                <AvatarFallback className="bg-transparent"><AIAvatar /></AvatarFallback>
              </Avatar>
            )}
            <div className={cn(`rounded-lg p-3 max-w-[85%] shadow-sm group relative`, {
              'bg-muted': message.role === 'ai',
              'bg-primary text-primary-foreground': message.role === 'user'
            })}>
              {message.type === 'quiz' && message.quiz ? (
                <div className={cn("quiz-container", { "pointer-events-none opacity-60": message.isAnswered })}>
                  {message.quiz.type === 'matching' ? (
                    <MatchingQuiz
                      pairs={Array.isArray((message.quiz as MatchingQuizData).pairs) 
                        ? (message.quiz as MatchingQuizData).pairs 
                        : []}
                      onSubmit={(matches) => handleQuizSubmit(message.quiz!, matches, index)}
                    />
                  ) : message.quiz.type === 'fill-in-blanks' ? (
                    <FillInBlanksQuiz
                      text={(message.quiz as FillInBlanksQuizData).text}
                      blanks={(message.quiz as FillInBlanksQuizData).blanks}
                      onSubmit={(answers) => handleQuizSubmit(message.quiz!, answers, index)}
                    />
                  ) : (
                    <Quiz
                      question={{
                        id: `quiz-${index}`,
                        ...message.quiz as MultipleChoiceQuizData
                      }}
                      onSubmit={(answers) => handleQuizSubmit(message.quiz!, answers, index)}
                    />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <MarkdownRenderer
                    content={message.content}
                    className={cn({
                      "prose-p:text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground": 
                      message.role === "user"
                    })}
                  />
                </div>
              )}
            </div>
            {message.role === 'user' && (
               <Avatar className="shrink-0">
                  <AvatarImage src={userProfile?.avatarUrl} alt="User avatar" />
                  <AvatarFallback><User size={20} /></AvatarFallback>
                </Avatar>
            )}
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && (
          <div className="flex items-start gap-4">
            <Avatar className="bg-transparent text-accent-foreground shrink-0">
              <AvatarFallback className="bg-transparent"><AIAvatar /></AvatarFallback>
            </Avatar>
            <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-200"></div>
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300"></div>
              <span className="text-sm text-muted-foreground ml-2 animate-pulse">
                {thinkingMessage}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 md:static p-4 border-t bg-background">
        {showSuggestions && suggestedPrompts.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedPrompts.map((prompt, i) => (
              <Button 
                key={`prompt-${i}-${prompt.slice(0, 10)}`}
                variant="outline"
                size="sm"
                onClick={() => handlePromptClick(prompt)}
                className="text-xs h-auto whitespace-normal"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                {prompt}
              </Button>
            ))}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
            <FormField
              control={form.control}
              name="currentProgress"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea 
                      {...field}
                      placeholder="Ask a question or describe your progress..." 
                      className="min-h-0 overflow-y-hidden resize-none"
                      rows={1}
                      disabled={isLoading}
                      ref={textareaRef}
                      onChange={(e) => {
                        field.onChange(e);
                        handleTextAreaChange(e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if(form.formState.isValid) {
                            form.handleSubmit(onSubmit)();
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} size="icon" aria-label="Send message">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </div>
    </div>

      {/* Quiz Side Panel */}
        <div className="hidden md:flex flex-col w-80 border-l">
            <Collapsible
                open={isQuizPanelOpen}
                onOpenChange={setIsQuizPanelOpen}
                className="flex-1 flex flex-col"
            >
                <div className="p-4 border-b">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                            <h2 className="text-lg font-semibold">Quiz Mode</h2>
                            {isQuizPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="flex flex-col items-center text-center">
                        <StreakDonut streak={quizStats.streakCount} />
                        <p className="text-sm text-muted-foreground mt-2">Current Streak</p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowQuizModal(true)}
                    >
                        Start New Quiz
                    </Button>
                </CollapsibleContent>
            </Collapsible>
        </div>


      {/* Quiz Modal */}
      {userProfile && (
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}

