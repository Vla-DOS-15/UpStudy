'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Clock, Banknote } from 'lucide-react';

// Мок-дані (потім замінимо на fetchOrders)
const MOCK_ORDERS = [
  { id: 1, title: 'Курсова робота з макроекономіки', price: 1500, subject: 'Економіка', deadline: '2024-02-10', type: 'Курсова' },
  { id: 2, title: 'Розробка API на .NET Core', price: 3000, subject: 'IT', deadline: '2024-02-05', type: 'Програмування' },
  { id: 3, title: 'Есе з філософії', price: 400, subject: 'Гуманітарні', deadline: '2024-01-25', type: 'Есе' },
];

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Біржа замовлень</h2>
          <p className="text-muted-foreground">Знайдіть завдання та зробіть свою ставку.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Пошук..." className="pl-8" />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Фільтри
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_ORDERS.map((order) => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="secondary">{order.subject}</Badge>
                <span className="font-bold text-lg text-green-600">{order.price} ₴</span>
              </div>
              <CardTitle className="line-clamp-2 mt-2">{order.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {order.deadline}
                </div>
                <div className="flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  {order.type}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Переглянути деталі</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}