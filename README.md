
# PathFinder AI

PathFinder AI is a Next.js application designed to provide personalized career guidance and roadmaps, tailored for the African job market. It leverages AI to generate career suggestions, create learning roadmaps, and connect users with mentors and communities.

## ✨ Features

-   **AI-Powered Career Suggestions:** Get personalized career recommendations based on your skills, interests, and background.
-   **Dynamic Roadmap Generation:** Generate step-by-step roadmaps for any chosen career path.
-   **Progress Tracking:** Monitor your progress by completing milestones and acquiring new skills, visualized with charts.
-   **AI Monthly Check-ins:** Chat with an AI coach to refine your roadmap and get encouragement.
-   **Community & Mentor Connect:** Discover tech communities and find mentors to guide you.
-   **PWA & Push Notifications:** Install the app on your device and receive updates via push notifications.
-   **Subscription Model:** Integrated with Paystack for Pro plan subscriptions, including billing history and receipts.

## 💙 Social & Economic Impact

PathFinder AI aims to address critical challenges in the African job market by:

-   **Empowering Youth:** Providing young Africans with the clarity and direction needed to pursue high-demand careers.
-   **Bridging the Skills Gap:** Aligning learning paths with the actual needs of the industry, helping to create a workforce that is ready for the future.
-   **Fostering Economic Growth:** By upskilling talent and connecting individuals to better job opportunities, we contribute to local and continental economic development.
-   **Democratizing Career Guidance:** Making high-quality, personalized career coaching accessible to everyone, regardless of their background or location.

## Sustainable Development Goals

### 🇺🇳 Alignment with UN SDG 4: Quality Education

This project directly contributes to **Target 4.4** of the UN Sustainable Development Goals:

> *"By 2030, substantially increase the number of youth and adults who have relevant skills, including technical and vocational skills, for employment, decent jobs and entrepreneurship."*

PathFinder AI achieves this by providing a scalable and accessible platform for personalized learning and skill acquisition, making technical education more attainable and directly linking it to employment outcomes.

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

First, install the necessary packages using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires environment variables for Firebase and Paystack integration.

Create a `.env` file in the root of your project and add the following variables.

#### Firebase

Your Firebase configuration can be found in your Firebase project settings. Copy the config object values into your `.env` file.

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

You will need to create two subscription plans (monthly and annual) in your Paystack dashboard. You should also enable automated email receipts in your Paystack settings to ensure users receive them after payment.

```env
# Paystack Public Key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Paystack Plan Codes (from your dashboard)
NEXT_PUBLIC_PAYSTACK_MONTHLY_PLAN_CODE=PLN_...
NEXT_PUBLIC_PAYSTACK_ANNUAL_PLAN_CODE=PLN_...
```

#### Push Notifications (VAPID Keys)

Generate VAPID keys to enable push notifications.

```bash
npx web-push generate-vapid-keys
```

Add the public key to your `.env` file. The private key should be stored securely on your backend for sending notifications in a production environment.

```env
# VAPID Public Key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BA...
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

### 4. Run the Genkit AI Flows

To enable the AI features, you need to run the Genkit development server in a separate terminal:

```bash
npm run genkit:dev
```
