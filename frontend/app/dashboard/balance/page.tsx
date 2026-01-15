import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

export default function BalancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Фінанси</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90">Поточний баланс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">2 450.00 ₴</div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" className="w-full">
                <ArrowDownLeft className="mr-2 h-4 w-4" /> Поповнити
              </Button>
              <Button variant="secondary" size="sm" className="w-full">
                <ArrowUpRight className="mr-2 h-4 w-4" /> Вивести
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Історія транзакцій
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead className="text-right">Сума</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Мок-дані */}
                <TableRow>
                  <TableCell>12.01.2024</TableCell>
                  <TableCell>Оплата за замовлення #123</TableCell>
                  <TableCell className="text-right text-green-600">+1 200 ₴</TableCell>
                  <TableCell className="text-right">Успішно</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>10.01.2024</TableCell>
                  <TableCell>Комісія сервісу</TableCell>
                  <TableCell className="text-right text-red-600">-150 ₴</TableCell>
                  <TableCell className="text-right">Успішно</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}