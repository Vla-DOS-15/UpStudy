'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import OrderDetailsCard from '@/components/orders/OrderDetailsCard'; // Імпорт компонента
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
  // Якщо юзер - клієнт (тобто замовник цього ордера), то role = Client, інакше Executor
  // (Або просто беремо основну роль з user.roles, якщо вам так зручніше)
  const userRole = user?.roles?.includes('Executor') ? 'Executor' : 'Client';

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Назад до списку
      </Button>

      {/* Використовуємо наш новий компонент */}
      <OrderDetailsCard 
        userRole={userRole} 
        order={order} 
      />
    </div>
  );
}