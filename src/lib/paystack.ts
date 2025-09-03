import { z } from 'zod';

export const PaystackTransactionSchema = z.object({
  email: z.string().email(),
  amount: z.number(), // Amount in lowest currency unit (e.g., kobo, cents)
  currency: z.string(),
  reference: z.string().optional(),
  callback_url: z.string().url().optional(),
  plan: z.string().optional(),
  channels: z.array(z.enum(['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'applepay'])).optional(),
  metadata: z.record(z.any()).optional(),
});

export type PaystackTransaction = z.infer<typeof PaystackTransactionSchema>;

export const verifyPaystackTransaction = async (reference: string) => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return {
      success: data.status,
      data: data.data,
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return {
      success: false,
      error: 'Failed to verify transaction',
      data: null
    };
  }
};

export const initializePaystackTransaction = async (transactionData: PaystackTransaction) => {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();
    return {
      success: data.status,
      data: data.data,
    };
  } catch (error) {
    console.error('Error initializing transaction:', error);
    return {
      success: false,
      error: 'Failed to initialize transaction',
      data: null
    };
  }
};
