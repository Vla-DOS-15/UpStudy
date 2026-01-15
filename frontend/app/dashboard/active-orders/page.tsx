import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function ActiveOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">В роботі</h2>
      </div>

      <Tabs defaultValue="in-progress" className="w-full">
        <TabsList>
          <TabsTrigger value="in-progress">Виконуються</TabsTrigger>
          <TabsTrigger value="review">На перевірці</TabsTrigger>
          <TabsTrigger value="completed">Завершені</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-4">
          {/* Приклад картки активного замовлення */}
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Лабораторна робота з фізики</CardTitle>
                  <CardDescription>Замовник: Іван Петренко</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" /> Чат
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-4">
                <span className="font-semibold">Дедлайн:</span> 20.02.2024 (через 3 дні)
              </div>
              <div className="flex gap-2">
                <Button>Здати роботу</Button>
                <Button variant="ghost">Деталі</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <div className="text-center py-10 text-muted-foreground">Немає робіт на перевірці</div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="text-center py-10 text-muted-foreground">Історія порожня</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}