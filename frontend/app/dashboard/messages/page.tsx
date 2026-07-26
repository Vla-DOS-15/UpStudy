'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import api from '@/lib/axios';

interface ChatOverview {
  chatId: string;
  orderId: string;
  orderTitle: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get('/Chat/my-chats');
        setChats(res.data);
      } catch (error) {
        console.error('Failed to fetch chats', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Повідомлення</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            Всі чати
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chats.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              У вас поки немає повідомлень
            </div>
          ) : (
            <div className="divide-y">
              {chats.map((chat) => (
                <Link
                  key={chat.chatId}
                  href={`/dashboard/chat/${chat.chatId}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    {chat.otherUserAvatar && <AvatarImage src={chat.otherUserAvatar} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {chat.otherUserName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col overflow-hidden mr-4">
                        <span className="font-medium text-base truncate">{chat.otherUserName}</span>
                        <span className="text-sm font-semibold text-primary truncate">{chat.orderTitle}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                        {chat.lastMessageTime ? formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true, locale: uk }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">{chat.lastMessage || 'Немає повідомлень'}</p>
                      {chat.unreadCount > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
