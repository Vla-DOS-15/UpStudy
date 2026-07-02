'use client';

import { useEffect, useState } from 'react';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import OrderListItem from '@/components/orders/OrderListItem';
import { Clock } from 'lucide-react';

export default function PendingOrdersClient() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPendingOrders = async () => {
            try {
                const data = await orderService.getPendingOrders();
                setOrders(data);
            } catch (error) {
                console.error(error);
                toast.error('Не вдалося завантажити замовлення');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingOrders();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Завантаження...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">В очікуванні</h1>
                    <p className="text-muted-foreground mt-2">
                        Завдання, на які ви подали заявку, але замовник ще не обрав виконавця.
                    </p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-card shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Немає завдань в очікуванні</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Ви ще не подали жодної заявки, яка очікує на рішення. Перейдіть на біржу, щоб знайти нові замовлення.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderListItem 
                            key={order.id} 
                            orderPreview={order} 
                            userRole="Executor"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
