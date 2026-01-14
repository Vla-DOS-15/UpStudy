import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Використовуємо той самий хедер, він адаптується під авторизованого юзера */}
      <Header /> 
      
      <div className="flex flex-1 container mx-auto max-w-7xl">
        {/* Сайдбар зліва */}
        <Sidebar />
        
        {/* Контент справа */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}