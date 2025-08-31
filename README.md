# PathFinder AI - Your Personal AI Learning Companion

PathFinder AI is a Next.js application designed to provide **personalized, accessible, and AI-powered lifelong learning**, tailored to individual goals and the evolving job market, with a special focus on empowering learners in Africa.

## 💙 Our Mission & Alignment with SDG 4

In line with **UN Sustainable Development Goal 4 (Quality Education)**, PathFinder AI is built to provide inclusive and equitable quality education and promote lifelong learning opportunities for all. We are not just a career guidance tool; we are a lifelong learning assistant.

-   **Equitable Access:** We provide **3 free, personalized learning roadmaps** to anyone, anywhere, curating high-quality, free resources like open-source courses, YouTube tutorials, and community content.
-   **Personalized Quality Education:** Our AI generates customized learning journeys that adapt to different educational levels and goals—from students to professionals upskilling for the future.
-   **Lifelong Learning:** We support continuous education, whether it's acquiring new hard skills, developing soft skills, or pursuing entrepreneurship.
-   **Inclusivity & Community:** We foster peer-to-peer learning through mentor and community connections, filling gaps left by formal education systems. Our roadmap includes future support for local languages and accessibility features like text-to-speech.

## ✨ Features

-   **AI-Powered Learning Suggestions:** Get personalized learning path recommendations based on your skills, interests, and aspirations.
-   **Dynamic Roadmap Generation:** Generate step-by-step learning roadmaps for any chosen skill or career path.
-   **Progress Tracking & Analytics:** Monitor your progress with basic tracking for free. Pro users get advanced analytics, including skill mastery visualization and readiness assessments.
-   **AI Monthly Check-ins:** Chat with an AI coach to refine your roadmap and stay motivated.
-   **Community & Mentor Connect:** Discover tech communities and find mentors to guide you. Pro users get access to verified mentors.

## 💰 Monetization Model

Our model is designed to be sustainable while keeping the core service accessible.

-   **Freemium:**
    -   3 free AI-generated roadmaps.
    -   Access to unverified mentors and communities.
    -   Basic progress tracking.
-   **Premium (Pro Plan):**
    -   Unlimited roadmaps and advanced learning analytics.
    -   Access to a network of verified mentors.
-   **One-Off Purchases:**
    -   Buy additional roadmaps without a subscription.
-   **Ecosystem Fees:**
    -   Mentors can pay a small fee to get verified and offer paid group sessions.
    -   Organizations (NGOs, startups) can pay to create "verified communities" on the platform.

## 🚀 Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
-   **AI:** [Google AI & Genkit](https://firebase.google.com/docs/genkit)
-   **Authentication & Database:** [Firebase Auth & Firestore](https://firebase.google.com/)
-   **Payments:** [Paystack](https://paystack.com/)

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in your project root.

#### Firebase
Copy your Firebase web app configuration into `.env`.
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
```

#### Paystack
Create product/payment links in your Paystack dashboard. You will add these links directly to the pricing page component. For post-payment redirection, set the redirect URL in your Paystack dashboard to point to `/payment/complete` (e.g., `https://your-domain.com/payment/complete`).

#### Push Notifications (VAPID Keys)
```bash
npx web-push generate-vapid-keys
```
Add the public key to your `.env` file.
```env
# VAPID Public Key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BA...
```

### 3. Run the Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

### 4. Run the Genkit AI Flows
In a separate terminal, run the Genkit development server:
```bash
npm run genkit:dev
```
