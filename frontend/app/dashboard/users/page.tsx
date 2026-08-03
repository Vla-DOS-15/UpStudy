'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/userService';
import { ConsultantPreviewDto } from '@/types';
import { Star, CheckCircle, Briefcase } from 'lucide-react';

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<ConsultantPreviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const data = await userService.getUsers();
        setConsultants(data);
      } catch (error) {
        console.error('Помилка завантаження рейтингу авторів', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Завантаження рейтингу...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Рейтинг авторів</h2>
        <p className="text-muted-foreground">Знайдіть найкращого спеціаліста для вашого завдання</p>
      </div>

      {consultants.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Поки що немає авторів</h3>
          <p className="text-muted-foreground mt-2">Виконавці ще не зареєстровані на платформі.</p>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {consultants.map((consultant) => (
            <Link href={`/dashboard/users/${consultant.id}`} key={consultant.id}>
              <Card className="group h-full overflow-hidden flex flex-col transition-all hover:shadow-md border-border/50">
              <CardHeader className="p-4 pb-2">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={consultant.avatarUrl || ''} />
                    <AvatarFallback className="text-xl">
                      {consultant.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base flex items-center justify-center gap-1 text-foreground">
                      {consultant.firstName} {consultant.lastName}
                      {consultant.isVerified && (
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </h3>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium text-foreground">{consultant.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{consultant.completedOrdersCount} робіт</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                    {consultant.aboutMe || "Спеціаліст не додав інформацію про себе."}
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                  {consultant.disciplines.slice(0, 3).map((d) => (
                    <Badge key={d} variant="secondary" className="font-normal text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/20">
                      {d}
                    </Badge>
                  ))}
                  {consultant.disciplines.length > 3 && (
                    <Badge variant="outline" className="font-normal text-[10px] px-1.5 py-0">
                      +{consultant.disciplines.length - 3}
                    </Badge>
                  )}
                  {consultant.disciplines.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">Немає предметів</span>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
