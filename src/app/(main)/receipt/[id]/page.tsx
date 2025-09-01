
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { Logo } from "@/components/logo";
import { onAuthStateChanged } from "firebase/auth";

type Transaction = {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  date: Timestamp;
};

type UserProfile = {
    displayName?: string;
    email?: string;
};


export default function ReceiptPage() {
  const params = useParams();
  const { id } = params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const txDocRef = doc(db, "users", user.uid, "transactions", id as string);

            try {
                const [userDoc, txDoc] = await Promise.all([
                    getDoc(userDocRef),
                    getDoc(txDocRef)
                ]);

                if (userDoc.exists()) {
                    setUserProfile(userDoc.data() as UserProfile);
                } else {
                    setError("User profile not found.");
                }

                if (txDoc.exists()) {
                    setTransaction({ id: txDoc.id, ...txDoc.data() } as Transaction);
                } else {
                    setError("Receipt not found. It may belong to another user or does not exist.");
                }
            } catch (err) {
                console.error("Error fetching receipt:", err);
                setError("Failed to fetch receipt data.");
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("You must be logged in to view this receipt.");
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen text-center p-4">
            <div className="bg-destructive/10 border border-destructive text-destructive p-8 rounded-lg">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p>{error}</p>
            </div>
        </div>
    );
  }
  
  if (!transaction || !userProfile) {
    return null; // Should be covered by error state
  }
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-muted min-h-screen p-4 sm:p-8 flex justify-center">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-container, #receipt-container * {
            visibility: visible;
          }
          #receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          #print-button {
            display: none;
          }
        }
      `}</style>
      <div id="receipt-container" className="bg-background shadow-lg rounded-lg p-8 sm:p-12 w-full max-w-2xl">
        <header className="flex justify-between items-start pb-8 border-b">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Receipt</h1>
            <p className="text-muted-foreground">Transaction ID: {transaction.reference}</p>
          </div>
          <Logo />
        </header>

        <section className="grid sm:grid-cols-2 gap-8 my-8">
          <div>
            <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Billed To</h2>
            <p className="font-medium text-foreground">{userProfile.displayName}</p>
            <p className="text-muted-foreground">{userProfile.email}</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Payment Details</h2>
            <p className="font-medium text-foreground">Date: {transaction.date.toDate().toLocaleDateString()}</p>
            <p className="text-muted-foreground">Status: <span className="capitalize font-medium text-green-600">{transaction.status}</span></p>
          </div>
        </section>

        <section>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 font-semibold uppercase text-xs text-muted-foreground">Description</th>
                <th className="p-3 text-right font-semibold uppercase text-xs text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">{transaction.planName}</td>
                <td className="p-3 text-right">{transaction.amount.toFixed(2)} {transaction.currency}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-8 text-right">
          <div className="space-y-2">
            <p className="text-muted-foreground">Subtotal: <span className="text-foreground font-medium">{transaction.amount.toFixed(2)} {transaction.currency}</span></p>
            <p className="text-muted-foreground">Tax (0%): <span className="text-foreground font-medium">0.00 {transaction.currency}</span></p>
            <p className="text-2xl font-bold text-foreground">Total: {transaction.amount.toFixed(2)} {transaction.currency}</p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
          <p>Thank you for your purchase! If you have any questions, please contact support.</p>
          <p>PathFinder AI &copy; {new Date().getFullYear()}</p>
        </footer>
        
        <div id="print-button" className="text-center mt-8">
            <Button onClick={handlePrint}>
                <Printer className="mr-2" />
                Print or Save as PDF
            </Button>
        </div>
      </div>
    </div>
  );
}
