import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export async function checkAndUpdateProStatus(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userData = (await getDoc(userRef)).data();

  if (!userData) return;

  // Get the latest transaction to confirm pro status
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const q = query(
    transactionsRef, 
    where('status', '==', 'success'),
    orderBy('date', 'desc'),
    limit(1)
  );
  
  const transactionSnapshot = await getDocs(q);
  const latestTransaction = transactionSnapshot.docs[0]?.data();

  const now = new Date();
  let subscriptionEndDate = userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null;

  // If we have a successful pro plan transaction but no end date, calculate it
  if (latestTransaction?.planId?.startsWith('pro') && !subscriptionEndDate) {
    const transactionDate = new Date(latestTransaction.date.toDate());
    subscriptionEndDate = latestTransaction.planId === 'pro-monthly'
      ? new Date(transactionDate.setMonth(transactionDate.getMonth() + 1))
      : new Date(transactionDate.setFullYear(transactionDate.getFullYear() + 1));
    
    // Update the subscription end date
    await setDoc(userRef, {
      isProUser: true,
      subscriptionStatus: 'active',
      subscriptionPlan: latestTransaction.planId,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    }, { merge: true });
  }

  // If subscription has ended or there's no valid pro transaction, update user status
  if (!subscriptionEndDate || now > subscriptionEndDate) {
    await setDoc(userRef, {
      isProUser: false,
      subscriptionStatus: 'inactive',
      subscriptionPlan: null,
      subscriptionEndDate: null,
    }, { merge: true });
  }

  return userData;
}
