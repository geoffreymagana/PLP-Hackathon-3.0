"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Frown, Meh, Smile } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const feedbackFormSchema = z.object({
  satisfaction: z.enum(["dissatisfied", "neutral", "satisfied"], {
    required_error: "You need to select a satisfaction level.",
  }),
  feedback: z.string().min(10, "Please provide at least 10 characters of feedback.").max(1000, "Feedback cannot exceed 1000 characters."),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export default function FeedbackPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
  });

  const onSubmit = (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log(data);
      setIsSubmitting(false);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve PathFinder AI.",
      });
      form.reset();
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Submit Feedback"
        description="We value your opinion. Let us know how we can improve."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
            <CardDescription>
              Your feedback is crucial in helping us make PathFinder AI better for everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="satisfaction"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Overall, how satisfied are you with the app?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row sm:gap-8"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="dissatisfied" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Frown className="text-red-500" /> Dissatisfied</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Meh className="text-yellow-500" /> Neutral</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="satisfied" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Smile className="text-green-500" /> Satisfied</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What can we do to improve?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us what you liked or what could be better..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Feedback
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
