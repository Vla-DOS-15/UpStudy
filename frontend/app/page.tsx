import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, GraduationCap, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 text-center px-4 bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Знайди допомогу з <span className="text-primary">навчанням</span> <br className="hidden md:block" /> 
              або монетизуй свої знання
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              UpStudy — це безпечна платформа, що з'єднує студентів та кваліфікованих експертів. 
              Гарантія якості, прозорі умови та зручний чат.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-lg" asChild>
                <Link href="/register">
                  Розпочати зараз <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
                <Link href="#features">Як це працює?</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Roles Section (Dual Choice) */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Card for Student */}
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">Я Замовник</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Потрібна допомога з курсовою, рефератом чи лабораторною? 
                    Знайди перевіреного виконавця за лічені хвилини.
                  </p>
                  <ul className="text-left space-y-2 mb-6 pl-4">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Публікуй завдання безкоштовно</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Безпечна оплата (Safe Deal)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Реальні відгуки про авторів</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Card for Executor */}
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">Я Виконавець</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Маєш глибокі знання в своїй сфері? 
                    Допомагай іншим навчатися та отримуй гідну оплату.
                  </p>
                  <ul className="text-left space-y-2 mb-6 pl-4">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Доступ до бази замовлень</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Гарантія виплати коштів</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Гнучкий графік роботи</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Переваги платформи</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                title="Безпечна угода" 
                desc="Ми гарантуємо фінансову безпеку. Кошти виконавцю перераховуються тільки після того, як ви підтвердите виконання роботи." 
              />
              <FeatureCard 
                title="Зручний чат" 
                desc="Спілкуйтесь, обмінюйтесь файлами та уточнюйте деталі безпосередньо на платформі без сторонніх месенджерів." 
              />
              <FeatureCard 
                title="Арбітраж" 
                desc="У разі виникнення спірних ситуацій, наші незалежні менеджери допоможуть вирішити питання справедливо." 
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t py-12 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <p className="mb-4">&copy; {new Date().getFullYear()} UpStudy. Всі права захищено.</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="#" className="hover:text-primary">Умови використання</Link>
            <Link href="#" className="hover:text-primary">Політика конфіденційності</Link>
            <Link href="#" className="hover:text-primary">Контакти</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all">
      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
        <CheckCircle className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}