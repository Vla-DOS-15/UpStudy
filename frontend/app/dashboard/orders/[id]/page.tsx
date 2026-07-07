'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService } from '@/services/orderService';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import OrderDetailsCard from '@/components/orders/OrderDetailsCard'; // Імпорт компонента
import CommissionPaymentForm from '@/components/orders/CommissionPaymentForm';
import ProposalsList from '@/components/orders/ProposalsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder(id as string);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося завантажити замовлення');
      router.push('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!order) return <div>Замовлення не знайдено</div>;

  // Визначаємо роль користувача відносно цього замовлення
  // Якщо юзер - автор замовлення, то role = Client
  // Якщо ні, але має роль Executor, то role = Executor
  // Інакше Viewer
  const isCreator = order.clientId === user?.id;
  const userRole = isCreator ? 'Client' : (user?.roles?.includes('Executor') ? 'Executor' : 'Viewer');

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Назад до списку
      </Button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Деталі замовлення</h1>
        <Button onClick={async () => {
          try {
            let candidateId = undefined;
            if (userRole === 'Client') {
              if (order.executorId) {
                candidateId = order.executorId;
              } else {
                toast.error('Виконавця не обрано. Неможливо відкрити чат.');
                return;
              }
            }
            const { chatId } = await chatService.initChat(order.id, candidateId);
            router.push(`/dashboard/chat/${chatId}`);
          } catch (error) {
            console.error(error);
            toast.error('Не вдалося відкрити чат');
          }
        }} className="gap-2">
          Відкрити чат
        </Button>
      </div>

      {/* Використовуємо наш новий компонент */}
      <OrderDetailsCard
        userRole={userRole}
        order={order}
      />

      {/* Форма оплати комісії для замовника, якщо виконавця обрано, але комісію ще не оплачено */}
      {userRole === 'Client' && order.executorId && !order.isCommissionPaid && order.status === 'New' && (
        <CommissionPaymentForm
          orderId={order.id}
          commissionAmount={order.platformCommission}
          status={order.commissionPaymentStatus}
          rejectReason={order.commissionRejectReason}
          onPaymentSubmitted={() => loadOrder(order.id)}
        />
      )}

      {/* Список ставок для замовника, якщо виконавця ще не обрано */}
      {userRole === 'Client' && !order.executorId && order.status === 'New' && (
        <ProposalsList 
          orderId={order.id} 
          onExecutorAccepted={() => loadOrder(order.id)}
        />
      )}
    </div>
  );
}