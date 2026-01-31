"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { chatService, ChatMessageDto } from "@/services/chatService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Paperclip, ArrowLeft, MoreVertical } from "lucide-react";
import { toast } from "sonner";

interface ChatWindowProps {
    chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
    const { user } = useAuth();
    const router = useRouter();

    // State
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Message Handler
    useEffect(() => {
        if (!user || !chatId) return;
        const token = Cookies.get("accessToken");
        if (!token) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const handleMessage = (msg: ChatMessageDto) => {
            setMessages((prev) => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        const initChat = async () => {
            try {
                // 1. Load History
                const history = await chatService.getChatMessages(chatId);
                if (isMounted) setMessages(history);

                // 2. Start SignalR
                await chatService.startConnection(token);
                await chatService.joinChat(chatId);

                // 3. Listen for messages
                chatService.offMessageReceived(handleMessage); // Safety cleanup
                chatService.onMessageReceived(handleMessage);

            } catch (error) {
                console.error("Chat init error", error);
                toast.error("Помилка підключення до чату");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initChat();

        return () => {
            isMounted = false;
            chatService.leaveChat(chatId);
            chatService.offMessageReceived(handleMessage);
        };
    }, [user, chatId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;

        try {
            setIsSending(true);

            if (newMessage.trim()) {
                await chatService.sendMessage(chatId, newMessage);
                setNewMessage("");
            }

        } catch (error) {
            toast.error("Не вдалося надіслати повідомлення");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsSending(true);
            await chatService.sendFile(chatId, file);
            toast.success("Файл надіслано");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            toast.error("Помилка завантаження файлу");
        } finally {
            setIsSending(false);
        }
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                </Button>
                <div className="text-center">
                    <h2 className="font-semibold text-lg">Чат</h2>
                    <p className="text-xs text-muted-foreground">ID: {chatId.slice(0, 8)}...</p>
                </div>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                        {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</p>}

                                        {msg.text && <p className="break-words">{msg.text}</p>}

                                        {msg.attachments?.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {msg.attachments.map(att => (
                                                    <a key={att.id} href={att.viewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs underline p-1 bg-background/20 rounded">
                                                        <Paperclip className="h-3 w-3" /> {att.originalFileName}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-[10px] text-right mt-1 opacity-70">
                                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-3 border-t bg-background flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <Input
                        placeholder="Напишіть повідомлення..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                    />

                    <Button onClick={handleSendMessage} disabled={isSending}>
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
