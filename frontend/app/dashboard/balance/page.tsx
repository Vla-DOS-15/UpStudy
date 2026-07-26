'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { BalanceOverviewDto } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function BalancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<BalanceOverviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await paymentService.getBalanceOverview();
        setData(overview);
      } catch (error) {
        console.error("Помилка завантаження балансу", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center">Завантаження фінансів...</div>;
  }

  // Визначаємо, що показувати користувачу залежно від його активності (чи витрачав, чи заробляв)
  const isClientActive = (data?.totalSpent ?? 0) > 0;
  const isExecutorActive = (data?.totalEarned ?? 0) > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Фінанси</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Карточка: Всього витрачено (для клієнта) */}
        { (isClientActive || (!isExecutorActive && user?.role === 'Client')) && (
          <Card className="md:col-span-1 bg-red-950/20 border-red-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2 text-red-500">
                <TrendingDown className="h-5 w-5" /> Всього витрачено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{data?.totalSpent.toFixed(2)} ₴</div>
            </CardContent>
          </Card>
        )}

        {/* Карточка: Всього зароблено (для виконавця) */}
        { (isExecutorActive || (!isClientActive && user?.role === 'Executor')) && (
          <Card className="md:col-span-1 bg-green-950/20 border-green-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2 text-green-500">
                <TrendingUp className="h-5 w-5" /> Всього зароблено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{data?.totalEarned.toFixed(2)} ₴</div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Історія транзакцій
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-x-auto">
            {data?.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Немає транзакцій</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-4 sm:px-2">Дата</TableHead>
                    <TableHead className="min-w-[200px] px-4 sm:px-2">Опис</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 sm:px-2">Сума</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 sm:px-2">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap px-4 sm:px-2">{format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: uk })}</TableCell>
                      <TableCell className="px-4 sm:px-2">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap px-4 sm:px-2 ${tx.isExpense ? 'text-red-500' : 'text-green-500'}`}>
                        {tx.isExpense ? '-' : '+'}{tx.amount.toFixed(2)} ₴
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap px-4 sm:px-2">
                        <span className={`px-2 py-1 rounded-full text-xs inline-block ${
                          tx.status === 'Успішно' ? 'bg-green-500/10 text-green-500' :
                          tx.status === 'В обробці' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}