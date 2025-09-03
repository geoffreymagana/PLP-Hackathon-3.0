
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  date: Timestamp;
};

export function BillingHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(
          collection(db, "users", user.uid, "transactions"),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        const userTransactions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(userTransactions);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>
          View your past transactions and download receipts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow key={`${tx.id}-${index}`}>
                  <TableCell>
                    {tx.date ? tx.date.toDate().toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{tx.planName}</TableCell>
                  <TableCell className="text-right">
                    {tx.amount} {tx.currency}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        tx.status === "success" ? "default" : "destructive"
                      }
                      className={
                        tx.status === "success"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/receipt/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            You have no transaction history yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
