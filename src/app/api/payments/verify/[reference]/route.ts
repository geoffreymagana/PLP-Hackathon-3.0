import { NextResponse } from 'next/server';
import { verifyPaystackTransaction } from '@/lib/paystack';

export async function GET(
  request: Request,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;
    if (!reference) {
      return NextResponse.json(
        { status: 'error', message: 'Reference is required' },
        { status: 400 }
      );
    }

    const verified = await verifyPaystackTransaction(reference);
    
    return NextResponse.json({ 
      status: verified ? 'success' : 'failed' 
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
