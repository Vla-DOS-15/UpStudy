import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Знайди допомогу з <span className="text-blue-600">навчанням</span> <br /> або заробляй знаннями
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            UpStudy — це сучасна платформа, що з'єднує студентів та експертів. 
            Безпечні угоди, зручний чат та гарантія якості.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Почати зараз <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Дізнатись більше</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            <FeatureCard title="Безпечна оплата" desc="Кошти заморожуються до виконання роботи." />
            <FeatureCard title="Перевірені виконавці" desc="Рейтингова система та відгуки." />
            <FeatureCard title="Зручний чат" desc="Спілкуйтесь та обмінюйтесь файлами миттєво." />
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; 2024 UpStudy. Всі права захищено.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 border rounded-xl shadow-sm bg-gray-50 hover:shadow-md transition">
      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
        <CheckCircle />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}