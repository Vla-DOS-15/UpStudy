'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Briefcase, CalendarDays, MessageSquare, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import { userService } from '@/services/userService';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProfile(id as string);
    }
  }, [id]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.Error || 'Користувача не знайдено');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Завантаження профілю...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Помилка</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>Повернутися назад</Button>
      </div>
    );
  }

  const isExecutor = profile.roles?.includes('Executor');

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 -ml-3">
        <ArrowLeft className="w-4 h-4" /> Назад
      </Button>

      {/* Головна картка профілю */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <Avatar className="w-24 h-24 border-4 border-background shadow-md -mt-12">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {(profile.userName || profile.firstName)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-3 mt-4 sm:mt-0">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                  {profile.firstName} {profile.lastName}
                  {profile.isVerified && (
                    <ShieldCheck className="w-5 h-5 text-green-600" title="Верифікований користувач" />
                  )}
                </h1>
                <p className="text-primary font-medium">
                  {profile.userName ? `@${profile.userName}` : 'Без юзернейму'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {profile.roles?.map((role: string) => (
                  <Badge key={role} variant={role === 'Executor' ? 'default' : 'secondary'} className="capitalize">
                    {role === 'Executor' ? 'Виконавець' : 'Клієнт'}
                  </Badge>
                ))}
                {profile.registeredAt && new Date(profile.registeredAt).getFullYear() > 2000 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    На сайті з {format(new Date(profile.registeredAt), 'MMMM yyyy', { locale: uk })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {/* Тут може бути кнопка для чату в майбутньому */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ліва колонка: Статистика та предмети */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span>Виконані замовлення</span>
                </div>
                <span className="font-bold text-lg">{profile.completedOrdersCount}</span>
              </div>
              
              {isExecutor && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Рейтинг</span>
                  </div>
                  <span className="font-bold text-lg">{profile.rating.toFixed(1)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {isExecutor && profile.preferredDisciplines?.length > 0 && (
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Спеціалізація</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredDisciplines.map((d: string) => (
                    <Badge key={d} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {d}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.aboutMe && (
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Про себе</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.aboutMe}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Права колонка: Відгуки */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50 h-full flex flex-col">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                {isExecutor ? 'Відгуки клієнтів' : 'Відгуки'} ({profile.reviews?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {profile.reviews?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex-1 flex flex-col items-center justify-center">
                  <MessageSquare className="w-12 h-12 mb-3 text-muted-foreground/30" />
                  <p>Поки що немає відгуків</p>
                </div>
              ) : (
                <div className="divide-y">
                  {profile.reviews?.map((review: any) => (
                    <div key={review.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border shadow-sm">
                            <AvatarImage src={review.authorAvatarUrl} />
                            <AvatarFallback>{review.authorName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm">{review.authorName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {review.orderTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800/50">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap ml-13 pl-13">
                        {review.text || <span className="text-muted-foreground italic">Без коментаря</span>}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground ml-13 pl-13">
                        {format(new Date(review.createdAt), 'd MMMM yyyy, HH:mm', { locale: uk })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
