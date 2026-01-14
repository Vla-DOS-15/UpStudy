'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { 
  User, 
  PlusCircle, 
  FileText, 
  Star, 
  Wallet, 
  HelpCircle, 
  Search,
  LayoutDashboard
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Перевірка ролі (припускаємо, що роль приходить як масив string[])
  const isExecutor = user?.roles?.includes('Executor');

  // Вкладки для КЛІЄНТА
  const clientRoutes = [
    { href: '/dashboard/profile', label: 'Мій профіль', icon: User },
    { href: '/dashboard/create-order', label: 'Додати завдання', icon: PlusCircle },
    { href: '/dashboard/orders', label: 'Мої завдання', icon: FileText },
    { href: '/dashboard/consultants', label: 'Рейтинг консультантів', icon: Star },
    { href: '/dashboard/balance', label: 'Баланс', icon: Wallet },
    { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  ];

  // Вкладки для ВИКОНАВЦЯ
  const executorRoutes = [
    { href: '/dashboard/profile', label: 'Мій профіль', icon: User },
    { href: '/dashboard/market', label: 'Завдання (Біржа)', icon: Search },
    { href: '/dashboard/my-works', label: 'Мої завдання', icon: FileText }, // Ті, які він виконує
    { href: '/dashboard/consultants', label: 'Рейтинг консультантів', icon: Star },
    { href: '/dashboard/balance', label: 'Баланс', icon: Wallet },
    { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  ];

  const routes = isExecutor ? executorRoutes : clientRoutes;

  return (
    <nav className="flex flex-col gap-2 p-4 w-64 border-r min-h-[calc(100vh-64px)] bg-white hidden md:flex">
      {/* Заголовок меню */}
      <div className="mb-4 px-4 py-2">
        <h2 className="text-lg font-semibold tracking-tight text-gray-500">
          {isExecutor ? 'Кабінет Виконавця' : 'Кабінет Замовника'}
        </h2>
      </div>

      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start",
            pathname === route.href 
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
              : "hover:bg-gray-100",
          )}
        >
          <route.icon className="mr-2 h-5 w-5" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
}