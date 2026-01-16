'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  User, PlusCircle, FileText, Star, Wallet, HelpCircle, Search, 
  ChevronLeft, ChevronRight, LogOut, ShoppingBag, Briefcase 
} from 'lucide-react'; // Додав ShoppingBag та Briefcase
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isExecutor = user?.roles?.includes('Executor');

  // Вкладки для КЛІЄНТА
  const clientRoutes = [
    { href: '/dashboard/profile', label: 'Мій профіль', icon: User },
    { href: '/dashboard/create-order', label: 'Створити замовлення', icon: PlusCircle },
    // Клієнт теж може хотіти купити готову роботу
    { href: '/dashboard/shop', label: 'Купити готову роботу', icon: ShoppingBag }, 
    { href: '/dashboard/orders', label: 'Мої замовлення', icon: FileText },
    { href: '/dashboard/consultants', label: 'Рейтинг авторів', icon: Star },
    { href: '/dashboard/balance', label: 'Баланс', icon: Wallet },
    { href: '/dashboard/faq', label: 'Допомога', icon: HelpCircle },
  ];

  // Вкладки для ВИКОНАВЦЯ
  const executorRoutes = [
    { href: '/dashboard/profile', label: 'Мій профіль', icon: User },
    
    // 1. Пошук роботи (Біржа)
    { href: '/dashboard/market', label: 'Пошук замовлень', icon: Search }, 
    
    // 2. Поточні завдання (Active)
    { href: '/dashboard/active-orders', label: 'В роботі', icon: Briefcase }, 
    
    // 3. Продаж готового (Магазин - майбутній функціонал)
    { href: '/dashboard/my-shop', label: 'Мої готові роботи', icon: ShoppingBag }, 

    { href: '/dashboard/balance', label: 'Баланс', icon: Wallet },
    { href: '/dashboard/faq', label: 'Допомога', icon: HelpCircle },
  ];

  const routes = isExecutor ? executorRoutes : clientRoutes;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out h-screen sticky top-0",
          isCollapsed ? "w-[80px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-end px-4 border-b">
           {!isCollapsed && <span className="font-bold text-lg mr-auto text-primary">UpStudy</span>}
           <Button variant="ghost" size="icon" onClick={toggleSidebar}>
             {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
           </Button>
        </div>

        <nav className="flex-1 space-y-2 p-2 pt-4">
          {routes.map((route) => (
            isCollapsed ? (
              <Tooltip key={route.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={route.href}
                    className={cn(
                      buttonVariants({ variant: pathname === route.href ? "default" : "ghost", size: "icon" }),
                      "w-full h-12 flex items-center justify-center"
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {route.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  buttonVariants({ variant: pathname === route.href ? "secondary" : "ghost" }),
                  "justify-start w-full"
                )}
              >
                <route.icon className="mr-2 h-5 w-5" />
                {route.label}
              </Link>
            )
          ))}
        </nav>

        <div className="p-2 border-t">
            {isCollapsed ? (
                 <Button variant="ghost" size="icon" className="w-full" onClick={logout}>
                    <LogOut className="h-5 w-5 text-red-500" />
                 </Button>
            ) : (
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Вийти
                </Button>
            )}
        </div>
      </aside>
    </TooltipProvider>
  );
}