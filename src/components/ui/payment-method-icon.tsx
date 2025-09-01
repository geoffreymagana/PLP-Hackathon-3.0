import Image from 'next/image';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'card' | 'mpesa' | 'bank' | 'airtel' | 'apple_pay';

interface PaymentMethodIconProps {
  method: PaymentMethod;
  className?: string;
  size?: number;
}

const PAYMENT_ICONS = {
  card: {
    src: "https://img.icons8.com/emoji/48/credit-card-emoji.png",
    alt: "credit-card-emoji",
    size: 48
  },
  mpesa: {
    src: "https://img.icons8.com/material/48/mpesa.png",
    alt: "mpesa",
    size: 48
  },
  bank: {
    src: "https://img.icons8.com/metro/52/bank.png",
    alt: "bank",
    size: 52
  },
  airtel: {
    src: "https://img.icons8.com/nolan/64/airtel.png",
    alt: "airtel",
    size: 64
  },
  apple_pay: {
    src: "https://img.icons8.com/ios-filled/50/apple-pay.png",
    alt: "apple-pay",
    size: 50
  }
};

export function PaymentMethodIcon({ method, className, size }: PaymentMethodIconProps) {
  const icon = PAYMENT_ICONS[method];
  
  return (
    <div className={cn("relative inline-block", className)}>
      <Image
        src={icon.src}
        alt={icon.alt}
        width={size || icon.size}
        height={size || icon.size}
        className="object-contain"
      />
    </div>
  );
}
