'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut } from 'lucide-react';
import { clientRoutes, executorRoutes } from './Sidebar';

export function MobileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isExecutor = user?.roles?.includes('Executor');
  const routes = isExecutor ? executorRoutes : clientRoutes;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b text-left flex justify-center h-16 shrink-0">
          <SheetTitle className="text-xl font-bold text-primary">UpStudy</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: pathname === route.href ? "secondary" : "ghost" }),
                "w-full justify-start text-base"
              )}
            >
              <route.icon className="mr-3 h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t shrink-0">
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
            <LogOut className="mr-3 h-5 w-5" />
            Вийти
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
