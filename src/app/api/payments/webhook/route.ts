import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth, db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp, setDoc, query, where, getDocs, getDoc } from "firebase/firestore";

async function handleChargeSuccess(event: any) {
  const { reference, amount, currency, customer, metadata } = event.data;
  const { email, plan_code } = customer;
  
  // Get user by email
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const users = await getDocs(q);

  if (users.empty) {
    console.log('No user found for email:', email);
    return;
  }

  const user = users.docs[0];
  const userRef = doc(db, "users", user.id);
  const transactionRef = collection(db, "users", user.id, "transactions");

  // Record the transaction
  await addDoc(transactionRef, {
    reference,
    amount: amount / 100, // Convert from kobo/cents to main currency
    currency,
    status: "success",
    date: serverTimestamp(),
    planName: metadata?.planName || "Subscription",
    planId: plan_code || metadata?.planId,
  });

  if (plan_code) {
    // Subscription payment
    await setDoc(userRef, {
      isProUser: true,
      subscriptionStatus: 'active',
      subscriptionPlan: plan_code,
      subscriptionReference: reference,
      subscriptionStartDate: serverTimestamp(),
    }, { merge: true });
  } else if (metadata?.planId === 'one-off') {
    // Get user's current subscription status
    const userData = (await getDoc(userRef)).data();
    
    // Only give one month pro access if user hasn't had a one-off payment before
    if (!userData?.hadOneOffPayment) {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      await setDoc(userRef, {
        isProUser: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'one-off',
        subscriptionEndDate: oneMonthFromNow.toISOString(),
        hadOneOffPayment: true, // Mark that user has used their one-time pro access
        subscriptionReference: reference,
        subscriptionStartDate: serverTimestamp(),
      }, { merge: true });
    }
  }
}

async function handleSubscriptionDisable(event: any) {
  const email = event.data.customer?.email;
  if (!email) return;

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const users = await getDocs(q);

  if (!users.empty) {
    const userRef = doc(db, "users", users.docs[0].id);
    await setDoc(userRef, {
      isProUser: false,
      subscriptionStatus: 'inactive',
    }, { merge: true });
  }
}

export async function POST(req: Request) {
  try {
    // Log webhook request
    console.log('Received webhook request');
    const text = await req.text();
    console.log('Webhook payload:', text);

    // Verify signature
    const signature = req.headers.get("x-paystack-signature");
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(text)
      .digest("hex");

    if (hash !== signature) {
      console.log('Signature verification failed');
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(text);
    console.log('Processing event:', event.event);

    // Handle charge.success
    if (event.event === "charge.success") {
      const { reference, amount, currency, customer, metadata } = event.data;
      const { email, plan_code } = customer;

      // Find user
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const users = await getDocs(q);

      if (!users.empty) {
        const user = users.docs[0];
        const userRef = doc(db, "users", user.id);
        const transactionRef = collection(db, "users", user.id, "transactions");

        // Record transaction
        await addDoc(transactionRef, {
          reference,
          amount: amount / 100,
          currency,
          status: "success",
          date: serverTimestamp(),
          planName: metadata?.planName || "Subscription",
          planId: plan_code || metadata?.planId,
        });

        // Handle subscription vs one-off
        if (plan_code) {
          await setDoc(userRef, {
            isProUser: true,
            subscriptionStatus: 'active',
            subscriptionPlan: plan_code,
            subscriptionReference: reference,
            subscriptionStartDate: serverTimestamp(),
          }, { merge: true });
        } else if (metadata?.planId === 'one-off') {
          const userData = (await getDoc(userRef)).data();
          
          if (!userData?.hadOneOffPayment) {
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            
            await setDoc(userRef, {
              isProUser: true,
              subscriptionStatus: 'active',
              subscriptionPlan: 'one-off',
              subscriptionEndDate: oneMonthFromNow.toISOString(),
              hadOneOffPayment: true,
              subscriptionReference: reference,
              subscriptionStartDate: serverTimestamp(),
            }, { merge: true });
          }
        }
      }
    }

    // Handle subscription.disable
    else if (event.event === "subscription.disable") {
      if (event.data.customer?.email) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', event.data.customer.email));
        const users = await getDocs(q);

        if (!users.empty) {
          const userRef = doc(db, "users", users.docs[0].id);
          await setDoc(userRef, {
            isProUser: false,
            subscriptionStatus: 'inactive',
          }, { merge: true });
        }
      }
    }

    // Handle subscription.create
    else if (event.event === "subscription.create") {
      console.log("Subscription created:", event.data);
    }

    // Handle charge.failed
    else if (event.event === "charge.failed") {
      console.error("Payment failed:", event.data);
    }

    // Return success
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
