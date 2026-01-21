import { AdminSidebar } from "@/components/admin/admin-sidebar";
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
        {/* Можна додати AdminHeader, якщо потрібно */}
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}