import { Suspense } from 'react';
import { Checkout } from './checkout';
import { Spinner } from '@/components/ui/feedback';

export const metadata = { title: 'Thanh toán' };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Spinner className="py-32" />}>
      <Checkout />
    </Suspense>
  );
}
