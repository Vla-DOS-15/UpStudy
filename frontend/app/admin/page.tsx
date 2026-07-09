'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, DollarSign, UserCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";

interface DashboardStats {
  clientsCount: number;
  executorsCount: number;
  ordersCount: number;
  transactionsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        toast.error("Не вдалося завантажити статистику");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель управління</h1>
        <p className="text-muted-foreground mt-2">
          Ласкаво просимо до панелі адміністратора. Тут ви можете керувати користувачами, замовленнями та фінансами.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Link href="/admin/users" className="block transition-transform hover:scale-[1.02]">
          <Card className="hover:border-primary/50 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Користувачі</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : (stats?.clientsCount || 0) + (stats?.executorsCount || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>Клієнтів: {loading ? "..." : stats?.clientsCount || 0}</span>
                <span>Виконавців: {loading ? "..." : stats?.executorsCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="block transition-transform hover:scale-[1.02]">
          <Card className="hover:border-primary/50 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Замовлення</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats?.ordersCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Створено на платформі</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/payments" className="block transition-transform hover:scale-[1.02]">
          <Card className="hover:border-primary/50 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Транзакції</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats?.transactionsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Комісії та виплати</p>
            </CardContent>
          </Card>
        </Link>
        
      </div>
    </div>
  );
}
