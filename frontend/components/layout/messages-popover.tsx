'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import api from '@/lib/axios';
import { chatService, ChatMessageDto } from '@/services/chatService';
import Cookies from 'js-cookie';

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

import { usePathname } from 'next/navigation';

export function MessagesPopover() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const [chats, setChats] = useState<ChatOverview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);

  // Initial fetch of unread count
  useEffect(() => {
    if (user) {
      chatService.getTotalUnreadCount().then(setGlobalUnreadCount).catch(console.error);
    }
  }, [user]);

  // Listen to new messages from SignalR
  useEffect(() => {
    if (!user) return;
    
    const token = Cookies.get("accessToken");
    if (token) {
        chatService.startConnection(token).catch(console.error);
    }

    const handleNewMessage = (msg: ChatMessageDto) => {
      // Prevent flicker: if we are already in this chat, the ChatWindow will instantly mark it as read.
      if (msg && msg.chatId && pathnameRef.current === `/dashboard/chat/${msg.chatId}`) {
        return; 
      }
      
      // Refresh global count when a new message arrives
      chatService.getTotalUnreadCount().then(setGlobalUnreadCount).catch(console.error);
      if (isOpen) {
        fetchChats(); // Refresh chat list if popover is open
      }
    };

    const handleUnreadUpdate = () => {
      chatService.getTotalUnreadCount().then(setGlobalUnreadCount).catch(console.error);
      if (isOpen) fetchChats();
    };

    chatService.onMessageReceived(handleNewMessage);
    chatService.onUnreadCountUpdated(handleUnreadUpdate);

    // Note: We don't stop the connection on unmount here because we want it to stay alive 
    // across navigation, or let it die if the user logs out.
    return () => {
      chatService.offMessageReceived(handleNewMessage);
      chatService.offUnreadCountUpdated(handleUnreadUpdate);
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      fetchChats();
    }
  }, [isOpen, user]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/Chat/my-chats');
      setChats(res.data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {globalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {globalUnreadCount > 99 ? '99+' : globalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Повідомлення</h4>
          <Link href="/dashboard/messages" className="text-xs text-primary hover:underline" onClick={() => setIsOpen(false)}>
            Всі чати
          </Link>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Немає повідомлень
            </div>
          ) : (
            chats.map((chat) => (
              <Link
                key={chat.chatId}
                href={`/dashboard/chat/${chat.chatId}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
              >
                <Avatar className="h-9 w-9">
                  {chat.otherUserAvatar && <AvatarImage src={chat.otherUserAvatar} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {chat.otherUserName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate">{chat.otherUserName}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {chat.lastMessageTime ? formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true, locale: uk }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || 'Немає повідомлень'}</p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {chat.unreadCount}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
