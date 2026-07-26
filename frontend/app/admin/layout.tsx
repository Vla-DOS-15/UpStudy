import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileAdminSidebar } from "@/components/admin/mobile-admin-sidebar";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | UpStudy",
  robots: "noindex, nofollow", // Не індексувати адмінку
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Верхня панель (Topbar) */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-card sticky top-0 z-10 md:hidden">
           <div className="flex items-center gap-2">
             <MobileAdminSidebar />
             <h1 className="text-xl font-semibold">UpStudy Admin</h1>
           </div>
           <div className="flex items-center gap-4">
              <ModeToggle />
           </div>
        </header>

        {/* Верхня панель для десктопу (якщо треба, або просто перемикач теми) */}
        <div className="hidden md:flex h-16 border-b items-center justify-end px-4 md:px-6 bg-card sticky top-0 z-10">
           <ModeToggle />
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}