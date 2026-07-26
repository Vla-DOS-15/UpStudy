'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  FileCheck, 
  ShieldAlert, 
  LayoutDashboard, 
  LogOut,
  Banknote
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export const adminLinks = [
  { href: '/admin', label: 'Огляд', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Заявки верифікації', icon: FileCheck },
  { href: '/admin/users', label: 'Користувачі', icon: Users },
  { href: '/admin/orders', label: 'Замовлення', icon: FileCheck }, // Додамо на майбутнє
  { href: '/admin/payments', label: 'Платежі', icon: Banknote },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 border-r bg-muted/20 min-h-screen hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <span className="text-xl font-bold text-primary">UpStudy Admin</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start text-red-600" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Вийти
        </Button>
      </div>
    </aside>
  );
}