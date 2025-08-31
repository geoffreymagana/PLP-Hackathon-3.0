
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactInfoCard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
                Reach out to us directly through any of the channels below.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-foreground">Our Office</h4>
                    <p>123 Tech Avenue, Silicon Savannah</p>
                    <p>Nairobi, Kenya</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-foreground">Email Us</h4>
                    <p>General Inquiries: <a href="mailto:hello@pathfinder.ai" className="text-primary hover:underline">hello@pathfinder.ai</a></p>
                    <p>Support: <a href="mailto:support@pathfinder.ai" className="text-primary hover:underline">support@pathfinder.ai</a></p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-foreground">Call Us</h4>
                    <p>+254 700 123 456</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log(data);
      setIsSubmitting(false);
      toast({
        title: "Message Sent!",
        description: "Thanks for reaching out. We'll get back to you soon.",
      });
      form.reset();
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Contact Support"
        description="Have a question or need help? Fill out the form below or contact us directly."
      />
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Our team will respond to your inquiry as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="What is your message about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please describe your issue or question in detail." rows={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <ContactInfoCard />
        </div>
      </div>
    </div>
  );
}
