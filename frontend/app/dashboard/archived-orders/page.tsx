import ArchivedOrdersClient from './ArchivedOrdersClient';

export const metadata = {
  title: 'Архів | UpStudy',
  description: 'Архів замовлень, які не були призначені вам',
};

export default function ArchivedOrdersPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-20">
      <ArchivedOrdersClient />
    </div>
  );
}
