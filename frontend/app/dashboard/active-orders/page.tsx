'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { MessageSquare, Clock, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { chatService } from '@/services/chatService';

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося завантажити активні замовлення');
    } finally {
      setIsLoading(false);
    }
  };

  // Фільтрація по статусах
  const inProgressOrders = orders.filter(o => o.status === 'InProgress');
  const reviewOrders = orders.filter(o => o.status === 'Review');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  const isClient = user?.roles?.includes('Client');

  const handleChat = async (order: any) => {
    try {
      let candidateId: string | undefined;
      // Логіка переходу в чат
      // Якщо я Клієнт - мені треба вказати candidateId (виконавця)
      // Якщо я Виконавець - бекенд сам знає що я кандидат
      if (isClient) {
        if (order.executorId) {
          candidateId = order.executorId;
        } else {
          toast.error('Виконавця не знайдено, неможливо відкрити чат');
          return;
        }
      }

      const { chatId } = await chatService.initChat(order.id, candidateId);
      router.push(`/dashboard/chat/${chatId}`);
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося відкрити чат');
    }
  };

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysLeft = differenceInDays(date, new Date());
    const formattedDate = format(date, 'd MMMM yyyy', { locale: uk });

    let daysText = '';
    if (daysLeft < 0) daysText = '(прострочено)';
    else if (daysLeft === 0) daysText = '(сьогодні)';
    else daysText = `(через ${daysLeft} дн.)`;

    return `${formattedDate} ${daysText}`;
  };

  // Компонент картки замовлення
  const OrderCard = ({ order }: { order: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl mb-1 line-clamp-1" title={order.title}>
              {order.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-medium text-foreground/80">
                {order.disciplineName}
              </span>
              <span>•</span>
              <span>
                {isClient ? `Виконавець: ID ${order.executorId?.substring(0, 8) || '...'}` : `Замовник: ${order.clientName}`}
              </span>
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleChat(order)} className="shrink-0">
            <MessageSquare className="mr-2 h-4 w-4" /> Чат
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={`font-medium ${new Date(order.deadline) < new Date() ? 'text-red-500' : ''}`}>
              Дедлайн: {formatDeadline(order.deadline)}
            </span>
          </div>
          {order.price && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Бюджет:</span>
              <span className="text-green-600 font-bold">{order.price} ₴</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex gap-3">
        {/* Кнопки дій залежно від ролі і статусу */}
        {!isClient && order.status === 'InProgress' && (
          <Button className="w-full sm:w-auto" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
            Здати роботу
          </Button>
        )}

        <Button variant="ghost" className="w-full sm:w-auto" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
          Деталі
        </Button>
      </CardFooter>
    </Card>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 container max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">В роботі</h2>
      </div>

      <Tabs defaultValue="in-progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="in-progress">Виконуються</TabsTrigger>
          <TabsTrigger value="review">На перевірці</TabsTrigger>
          <TabsTrigger value="completed">Завершені</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-6 space-y-4">
          {inProgressOrders.length > 0 ? (
            inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState text="Немає активних замовлень в роботі" />
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-6 space-y-4">
          {reviewOrders.length > 0 ? (
            reviewOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState text="Немає замовлень на перевірці" />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedOrders.length > 0 ? (
            completedOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState text="Історія виконаних робіт порожня" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}