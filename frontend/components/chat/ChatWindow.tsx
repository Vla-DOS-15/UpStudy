"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { chatService, ChatMessageDto, ChatDetails } from "@/services/chatService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Paperclip, ArrowLeft, MoreVertical, CreditCard, ChevronRight, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services/orderService";
import { paymentService, PaymentRequest, CreatePaymentRequestDto } from "@/services/paymentService";
import { PaymentRequestCard } from "./PaymentRequestCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format, differenceInDays } from 'date-fns';
import { uk } from 'date-fns/locale';

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
    const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
    const [order, setOrder] = useState<any | null>(null);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [showSidebar, setShowSidebar] = useState(true); // Default open on desktop? Maybe false on mobile.

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentComment, setPaymentComment] = useState('');
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Helper functions
    const fetchOrder = async (orderId: string) => {
        try {
            const data = await orderService.getOrderById(orderId);
            setOrder(data);
            return data;
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error("Fetch Order Error", error);
            }
        }
    };

    const fetchPayments = async (orderId: string) => {
        try {
            const reqs = await paymentService.getRequestsByOrder(orderId);
            setPayments(reqs);
        } catch (e) {
            // 403 means not authorized (normal for candidates), ignore.
            // Other errors logged.
            // console.error(e); 
        }
    };

    const refreshPayments = () => {
        if (chatDetails?.orderId) {
            fetchPayments(chatDetails.orderId);
        }
    };

    // Initial Load
    useEffect(() => {
        if (!user || !chatId) return;

        const init = async () => {
            const token = Cookies.get("accessToken");
            if (!token) return;

            try {
                // 1. Get Chat Details (OrderId)
                const details = await chatService.getChatDetails(chatId);
                setChatDetails(details);

                // 2. Fetch Order & Messages
                const [orderData, history] = await Promise.all([
                    orderService.getOrderById(details.orderId),
                    chatService.getChatMessages(chatId)
                ]);

                setOrder(orderData);
                setMessages(history);



                // 3. Fetch Payments (Only if authorized)
                // We use the fetched orderData to check permissions IMMEDIATELY
                if (user.id === orderData.clientId || user.id === orderData.executorId) {
                    await fetchPayments(details.orderId);
                }

                // 4. Connect SignalR
                const token = Cookies.get("accessToken");
                if (token) {
                    await chatService.startConnection(token);
                    await chatService.joinChat(chatId);

                    chatService.offMessageReceived(handleMessage);
                    chatService.onMessageReceived(handleMessage);
                }

            } catch (error) {
                console.error("Init Error", error);
                toast.error("Помилка завантаження чату");
            } finally {
                setIsLoading(false);
            }
        };

        const handleMessage = (msg: ChatMessageDto) => {
            setMessages((prev) => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        init();

        return () => {
            chatService.leaveChat(chatId);
            chatService.offMessageReceived(handleMessage);
        };
    }, [user, chatId]);

    // Reactive Payment Refresh on System Messages
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.isSystem && chatDetails && order && user) {
            const isClient = user.id === order.clientId;
            const isExecutor = user.id === order.executorId;
            if (isClient || isExecutor) {
                fetchPayments(chatDetails.orderId);
            }
        }
    }, [messages, chatDetails, order, user]);

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
            toast.error("Не вдалося надіслати");
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
            toast.error("Помилка файлу");
        } finally {
            setIsSending(false);
        }
    };

    const handleCreatePayment = async () => {
        if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
            toast.error("Введіть коректну суму");
            return;
        }
        if (!chatDetails) return;

        try {
            setIsCreatingPayment(true);
            await paymentService.createRequest({
                orderId: chatDetails.orderId,
                amount: Number(paymentAmount),
                comment: paymentComment
            });
            toast.success("Запит на оплату відправлено");
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            setPaymentComment('');
            refreshPayments();
        } catch (error: any) {
            // Handle "Card not set" error specifically if possible
            const msg = error.response?.data?.error || "Помилка створення запиту";
            if (msg.includes("номер картки")) {
                toast.error("Вам потрібно додати номер картки в профілі!", {
                    action: {
                        label: "Профіль",
                        onClick: () => router.push('/dashboard/profile')
                    }
                });
            } else {
                toast.error(msg);
            }
        } finally {
            setIsCreatingPayment(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const isExecutor = user?.roles?.includes('Executor') || user?.role === 'Executor';
    const userRole = isExecutor ? 'Executor' : 'Client';

    return (
        <div className="flex h-[calc(100vh-4rem)] p-2 md:p-4 gap-4 max-w-7xl mx-auto">
            {/* Chat Area */}
            <div className={`flex flex-col flex-1 h-full min-w-0 transition-all duration-300 ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between mb-4 bg-background p-2 rounded shadow-sm border">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => router.back()} size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                        </Button>
                        <div className="ml-4">
                            <h2 className="font-semibold text-sm md:text-base truncate">{order?.title || "Замовлення"}</h2>
                            <p className="text-[10px] text-muted-foreground">{chatId.slice(0, 8)}... • {order?.status}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                        {showSidebar ? <ChevronRight className="h-4 w-4" /> : <LayoutList className="h-4 w-4 mr-2" />}
                        {showSidebar ? 'Приховати' : 'Деталі'}
                    </Button>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user?.id;
                                const isSystem = msg.isSystem;
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-2">
                                            <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground">
                                                {msg.text}
                                            </span>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 text-sm shadow-sm ${isMe ? "bg-primary text-primary-foreground dark:bg-[#133337] dark:text-white" : "bg-white border dark:bg-muted dark:text-foreground dark:border-none"}`}>
                                            {!isMe && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</p>}

                                            {msg.text && <p className="break-words whitespace-pre-wrap">{msg.text}</p>}

                                            {msg.attachments?.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {msg.attachments.map(att => (
                                                        <a key={att.id} href={att.viewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs underline p-1 bg-background/20 rounded hover:bg-background/30">
                                                            <Paperclip className="h-3 w-3" /> {att.originalFileName}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-[9px] text-right mt-1 opacity-70">
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
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        <Input
                            placeholder="Напишіть повідомлення..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            className="flex-1"
                        />

                        <Button onClick={handleSendMessage} disabled={isSending} size="icon" className="shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Sidebar (Details & Payments) */}
            {showSidebar && (
                <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4 animate-in slide-in-from-right duration-300 h-full overflow-hidden">
                    {/* Order Info Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Інформація про замовлення</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Бюджет:</span>
                                <span className="font-semibold">
                                    {order?.isNegotiable || !order?.price ? "Договірна" : `${order?.price} ₴`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Статус:</span>
                                <span className="font-semibold">{order?.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Опубліковано:</span>
                                <span>
                                    {order?.createdAt
                                        ? format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: uk })
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Дедлайн:</span>
                                    <span>
                                        {order?.deadline
                                            ? format(new Date(order.deadline), 'dd.MM.yyyy HH:mm', { locale: uk })
                                            : '-'}
                                    </span>
                                </div>
                                {order?.deadline && (
                                    <span className="text-xs text-right text-muted-foreground/80">
                                        (залишилось {Math.max(0, differenceInDays(new Date(order.deadline), new Date()))} дн.)
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments Section */}
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Платежі
                            </CardTitle>
                            {isExecutor && (
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setIsPaymentModalOpen(true)}>
                                    + Запит
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
                            {payments.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    Платежів ще немає
                                </p>
                            ) : (
                                payments.map(req => (
                                    <PaymentRequestCard
                                        key={req.id}
                                        request={req}
                                        userRole={userRole}
                                        onUpdate={refreshPayments}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Створити запит на оплату</DialogTitle>
                        <DialogDescription>
                            Введіть суму та коментар для клієнта.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Сума (грн) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment">Коментар (за що оплата)</Label>
                            <Textarea
                                id="comment"
                                value={paymentComment}
                                onChange={(e) => setPaymentComment(e.target.value)}
                                placeholder="Предоплата, повна оплата..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Скасувати</Button>
                        <Button onClick={handleCreatePayment} disabled={isCreatingPayment}>
                            {isCreatingPayment ? 'Створення...' : 'Надіслати запит'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

