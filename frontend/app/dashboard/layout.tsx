import { Sidebar } from '@/components/layout/Sidebar';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { MessagesPopover } from '@/components/layout/messages-popover';
import { Header } from '@/components/layout/Header'; // Або спрощений хедер для дашборду

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Flex-row: Сайдбар зліва, контент справа
    <div className="flex min-h-screen bg-background"> 
      
      {/* Сайдбар (сам керує своєю шириною) */}
      <Sidebar />

      {/* Основна область */}
      <div className="flex-1 flex flex-col">
        
        {/* Верхня панель (Topbar) */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-10">
           <h1 className="text-xl font-semibold">UpStudy Dashboard</h1>
           <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Баланс: 0.00 ₴</span>
              <MessagesPopover />
              <ModeToggle /> {/* Перемикач теми */}
              {/* Тут можна додати аватарку або сповіщення */}
           </div>
        </header>

        {/* Контент сторінки */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}