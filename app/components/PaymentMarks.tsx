'use client';

import Image from 'next/image';

interface PaymentMarksProps {
  className?: string;
}

export default function PaymentMarks({ className = '' }: PaymentMarksProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/images/payments/visa.svg"
        alt="Visa"
        width={40}
        height={26}
        className="h-6 w-auto"
      />
      <Image
        src="/images/payments/mastercard.svg"
        alt="Mastercard"
        width={40}
        height={26}
        className="h-6 w-auto"
      />
      <Image
        src="/images/payments/troy.svg"
        alt="Troy"
        width={40}
        height={26}
        className="h-6 w-auto"
      />
    </div>
  );
}
