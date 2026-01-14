import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from "@/components/providers";
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="uk">
      <body className={inter.className}>
        <Providers>
            <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}