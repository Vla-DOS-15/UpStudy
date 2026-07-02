import PendingOrdersClient from './PendingOrdersClient';

export const metadata = {
  title: 'В очікуванні | UpStudy',
  description: 'Замовлення, які очікують на підтвердження клієнтом',
};

export default function PendingOrdersPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-20">
      <PendingOrdersClient />
    </div>
  );
}
