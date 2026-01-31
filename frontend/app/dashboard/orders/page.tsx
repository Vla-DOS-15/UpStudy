import OrdersPageClient from './OrdersPageClient';

export const metadata = {
  title: 'Замовлення | UpStudy',
  description: 'Керування замовленнями та пошук роботи',
};

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-20">
      <OrdersPageClient />
    </div>
  );
}