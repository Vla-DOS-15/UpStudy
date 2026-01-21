import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/sonner"; // Важливо: імпорт з компонента UI
import { cn } from '@/lib/utils'; // Утиліта для класів

const inter = Inter({ subsets: ['latin', 'cyrillic'] }); // Додав кирилицю для кращого відображення укр. мови

export const metadata: Metadata = {
  title: 'UpStudy Freelance',
  description: 'Student freelance marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased", // Це забезпечує правильний фон для темної теми
          inter.className
        )}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}