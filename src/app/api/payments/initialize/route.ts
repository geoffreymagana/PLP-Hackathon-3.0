import { NextResponse } from "next/server";
import { PaystackTransactionSchema, initializePaystackTransaction } from "@/lib/paystack";
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const host = headersList.get('host');

    // Validate request body
    const validatedData = PaystackTransactionSchema.parse({
      ...body,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || `https://${host}`}/payment/complete`,
      channels: ['card', 'mobile_money'],
    });

    // Initialize transaction
    const result = await initializePaystackTransaction(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
