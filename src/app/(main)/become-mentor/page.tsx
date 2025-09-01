
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";
import { Badge } from "@/components/ui/badge";

const mentorFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email(),
  expertise: z.array(z.string()).min(1, "Please list at least one area of expertise."),
  bio: z.string().min(50, "Bio must be at least 50 characters long."),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL.").optional().or(z.literal('')),
  credentials: z
    .instanceof(File, { message: "Credential document is required." })
    .refine((file) => file.size <= 10000000, `Max file size is 10MB.`)
    .refine(
      (file) => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
      "Only .pdf, .doc, and .docx formats are supported."
    ),
});

type MentorFormValues = z.infer<typeof mentorFormSchema>;

type UserProfile = {
    skills?: string;
    savedRoadmaps?: {
        roadmap: {
            skills: string[];
        }[];
    }[];
};

const SKILLS_TRUNCATE_LIMIT = 10;

export default function BecomeMentorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);

  const form = useForm<MentorFormValues>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      name: auth.currentUser?.displayName || "",
      email: auth.currentUser?.email || "",
      expertise: [],
      bio: "",
      linkedinUrl: "",
    },
  });

  const expertiseSkills = form.watch("expertise");
  const displayedSkills = showAllSkills ? expertiseSkills : expertiseSkills.slice(0, SKILLS_TRUNCATE_LIMIT);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        form.reset({
          name: user.displayName || "",
          email: user.email || "",
          expertise: [],
        });
        
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            const profileSkills = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
            const roadmapSkills = profile.savedRoadmaps?.flatMap(r => r.roadmap.flatMap(step => step.skills)) || [];
            
            const allSkills = new Set([...profileSkills, ...roadmapSkills]);
            form.setValue('expertise', Array.from(allSkills));
        }

      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [form, router]);
  
  const handleNewSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skillsToAdd = newSkill.split(',').map(s => s.trim()).filter(s => s && !expertiseSkills.includes(s));
      if (skillsToAdd.length > 0) {
        form.setValue('expertise', [...expertiseSkills, ...skillsToAdd]);
      }
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    form.setValue('expertise', expertiseSkills.filter(skill => skill !== skillToRemove));
  };


  const onSubmit = async (data: MentorFormValues) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      setIsSubmitting(false);
      return;
    }
    
    const file = data.credentials;
    const storageRef = ref(storage, `mentor-applications/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your credentials. Please try again." });
        setIsSubmitting(false);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const applicationData = {
            ...data,
            expertise: data.expertise.join(', '),
            credentials: {
              name: file.name,
              url: downloadURL,
              size: file.size,
              type: file.type,
            },
            userId: user.uid,
            status: 'pending', // Initial status
            submittedAt: serverTimestamp(),
          };

          await setDoc(doc(db, "mentorApplications", user.uid), applicationData);
          
          toast({
            title: "Application Submitted!",
            description: "Thank you for your interest. We will review your application and get back to you soon.",
          });
          
          router.push("/settings");

        } catch (error) {
           console.error("Error saving application:", error);
           toast({ variant: "destructive", title: "Submission Failed", description: "There was a problem submitting your application." });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(null);
        }
      }
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Become a Mentor"
        description="Share your knowledge and guide the next generation of talent in Africa."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Mentor Application</CardTitle>
            <CardDescription>
              Complete the form below to apply. Our team will review your application for verification.
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
                          <Input {...field} disabled />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="expertise"
                  render={() => (
                    <FormItem>
                      <FormLabel>Areas of Expertise</FormLabel>
                       <FormControl>
                          <Input 
                            placeholder="Add skills and press Enter..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={handleNewSkillKeyDown}
                          />
                      </FormControl>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {displayedSkills.map((skill) => (
                           <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                            {skill}
                            <button onClick={() => removeSkill(skill)} type="button">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                       {expertiseSkills.length > SKILLS_TRUNCATE_LIMIT && (
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-sm"
                          onClick={() => setShowAllSkills(!showAllSkills)}
                        >
                          {showAllSkills ? 'Show less' : `Show all ${expertiseSkills.length} skills...`}
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about your experience, achievements, and what you're passionate about." rows={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.linkedin.com/in/your-profile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="credentials"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Credentials (CV/Resume)</FormLabel>
                            <FormControl>
                                <FileUpload 
                                    onFileSelect={(file) => field.onChange(file)}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                             <FormMessage />
                             {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
                        </FormItem>
                    )}
                    />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
