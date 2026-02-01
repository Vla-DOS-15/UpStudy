import { Suspense } from 'react';
import OrdersPageClient from './OrdersPageClient';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Замовлення | UpStudy',
  description: 'Керування замовленнями та пошук роботи',
};

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-20">
      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
        <OrdersPageClient />
      </Suspense>
    </div>
  );
}