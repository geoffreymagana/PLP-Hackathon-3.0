import { NextResponse } from "next/server";
import { z } from "zod";

const createPaymentSchema = z.object({
  email: z.string().email(),
  amount: z.number(),
  currency: z.string(),
  metadata: z.record(z.any()).optional(),
  reference: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createPaymentSchema.parse(body);

    // Ensure the currency is KES and amount is in the smallest currency unit (cents)
    // Build callback URL with all necessary parameters
    const callbackParams = new URLSearchParams({
      planId: validatedData.metadata?.planId || '',
      planName: validatedData.metadata?.planName || '',
      amount: validatedData.amount.toString(),
      currency: validatedData.currency,
      ...(validatedData.metadata?.career ? { career: validatedData.metadata.career } : {})
    });

    const paymentData = {
      ...validatedData,
      currency: 'KES', // Force KES as the currency
      amount: Math.round(validatedData.amount * 100), // Convert to cents
      channels: ['card', 'mobile_money'], // Limit to supported payment methods for KES
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/complete?${callbackParams.toString()}`,
    };

    console.log('Initializing payment with data:', paymentData);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack initialization failed:', data);
      return NextResponse.json(
        { error: data.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
