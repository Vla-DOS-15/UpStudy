'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { accountService } from '@/services/accountService';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface ReviewDto {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatarUrl?: string;
  orderId: string;
  orderTitle: string;
}

export default function ProfileReviews({ isExecutor }: { isExecutor: boolean }) {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await accountService.getMyReviews();
        if (isMounted) setReviews(data);
      } catch (error) {
        console.error("Не вдалося завантажити відгуки:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchReviews();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isExecutor ? 'Відгуки про вас' : 'Ваші відгуки'}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isExecutor ? 'Відгуки про вас' : 'Ваші відгуки'}</CardTitle>
        <CardDescription>
          {isExecutor 
            ? 'Тут відображаються відгуки від замовників за виконані завдання.' 
            : 'Тут відображаються відгуки, які ви залишили виконавцям.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">Відгуків ще немає</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isExecutor 
                ? 'Виконайте своє перше завдання, щоб отримати відгук.' 
                : 'Ви ще не залишили жодного відгуку.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="flex flex-col sm:flex-row gap-4 border-b last:border-b-0 pb-6 last:pb-0">
                <Avatar className="h-10 w-10 border shrink-0">
                  <AvatarImage src={isExecutor ? review.authorAvatarUrl : review.targetUserAvatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {(isExecutor ? review.authorName : review.targetUserName)?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">
                        {isExecutor ? review.authorName : review.targetUserName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: uk })}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded text-yellow-600 dark:text-yellow-500 font-medium text-xs">
                      {review.rating} <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 mb-2">
                    <span className="font-medium">Завдання:</span> {review.orderTitle}
                  </div>
                  
                  {review.text && (
                    <p className="text-sm text-foreground mt-2 italic">
                      "{review.text}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
