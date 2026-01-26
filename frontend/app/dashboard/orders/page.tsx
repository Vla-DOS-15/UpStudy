'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import OrderListItem from '@/components/orders/OrderListItem';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося завантажити список замовлень');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  const userRole = user?.roles?.includes('Executor') ? 'Executor' : 'Client';

  return (
    // Змінено max-w-5xl на container і додано більше простору
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-8 pb-20">
      
      {/* Хедер сторінки */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мої замовлення</h1>
          <p className="text-muted-foreground mt-1">Керуйте своїми поточними завданнями та проектами.</p>
        </div>
        {userRole === 'Client' && (
            <Button asChild className="shrink-0">
            <Link href="/dashboard/create-order">
                <PlusCircle className="mr-2 h-4 w-4" />
                Створити замовлення
            </Link>
            </Button>
        )}
      </div>

      {/* Список замовлень - ГРІД СІТКА */}
      {orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[300px]">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">У вас ще немає замовлень</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
             {userRole === 'Client' 
                ? "Створіть своє перше замовлення, щоб знайти виконавців." 
                : "Перейдіть до біржі, щоб знайти перше завдання."}
          </p>
          {userRole === 'Client' ? (
             <Button asChild variant="outline">
                <Link href="/dashboard/create-order">Створити перше замовлення</Link>
             </Button>
          ) : (
             <Button asChild variant="outline">
                <Link href="/dashboard/market">Знайти роботу</Link>
             </Button>
          )}
        </Card>
      ) : (
        // ОСЬ ТУТ ЗМІНИ: Grid Layout
        // 1 колонка на мобільному, 2 на середніх, 3 на великих
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {orders.map((order) => (
            <OrderListItem 
                key={order.id} 
                orderPreview={order} 
                userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}