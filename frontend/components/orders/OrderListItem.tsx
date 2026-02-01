'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Clock, CalendarDays, Eye, FileText, Download,
  Loader2, Users, MessageSquare, ChevronDown, ChevronUp,
  UserCircle, Award, Star, CheckCircle, MoreVertical, Pencil, Trash, Ban
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import { chatService } from '@/services/chatService';
import TakeOrderModal from './TakeOrderModal';

interface OrderPreview {
  id: string;
  title: string;
  status: string;
  price?: number;
  isNegotiable: boolean;
  deadline: string;
  createdAt: string;
  disciplineName: string;
  workTypeName: string;
  viewsCount?: number;
}

interface OrderListItemProps {
  orderPreview: OrderPreview;
  userRole: 'Client' | 'Executor';
}

export default function OrderListItem({ orderPreview, userRole }: OrderListItemProps) {
  const router = useRouter();
  const [fullOrder, setFullOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('task');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [proposalToReject, setProposalToReject] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [detailsData, proposalsData] = await Promise.all([
          orderService.getOrderById(orderPreview.id),
          userRole === 'Client' || userRole === 'Executor'
            ? orderService.getProposals(orderPreview.id).catch((err) => {
              console.error("Failed to load proposals for order " + orderPreview.id, err);
              // If 403, it means backend didn't update or logic is wrong
              return [];
            })
            : Promise.resolve([])
        ]);

        if (isMounted) {
          setFullOrder({
            ...detailsData,
            consultants: proposalsData.map((p: any) => ({
              id: p.id,
              userId: p.executorId,
              name: p.executorName,
              avatar: p.executorAvatar,
              rating: p.executorRating || 0,
              completedProjects: p.executorCompletedProjects || 0,
              specializations: p.executorSpecializations || [],
              isVerified: p.executorIsVerified || false,
              price: p.price,
              comment: p.comment
            }))
          });
        }
      } catch (error) {
        console.error("Помилка завантаження даних:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [orderPreview.id, userRole]);

  const formatPrice = (price?: number, isNegotiable?: boolean) => {
    if (isNegotiable) return 'Договірна';
    if (!price) return '0 ₴';
    return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(price) + ' ₴';
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Не вказано';
    return format(new Date(dateString), 'd MMMM yyyy, HH:mm', { locale: uk });
  };

  // Дії: Редагування/Видалення (тільки для Клієнта)
  const handleEdit = () => {
    // Переходимо на сторінку створення з параметром edit
    router.push(`/dashboard/create-order?edit=${orderPreview.id}`);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const onConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await orderService.deleteOrder(orderPreview.id);
      toast.success("Замовлення успішно видалено");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося видалити замовлення");
      setIsDeleting(false);
    }
  };

  const handleTakeOrderClick = async () => {
    try {
      setIsCheckingChat(true);
      const messages = await chatService.getMessages(orderPreview.id);
      setHasChatHistory(messages.length > 0);
      setIsTakeOrderModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося перевірити статус чату");
    } finally {
      setIsCheckingChat(false);
    }
  };

  const handleTakeOrderSubmit = async (price: number, comment?: string) => {
    try {
      const proposalComment = comment || "Готовий виконати ваше замовлення.";

      await orderService.createProposal({
        orderId: orderPreview.id,
        price: price,
        comment: proposalComment
      });

      toast.success("Ви успішно підписались на замовлення");

      if (comment && !hasChatHistory) {
        const { chatId } = await chatService.initChat(orderPreview.id);
        await chatService.sendMessage(chatId, comment);
      }

      window.location.reload();

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.Error || "Не вдалося взяти замовлення");
    }
  };

  const handleOpenChat = async (candidateId?: string) => {
    try {
      const { chatId } = await chatService.initChat(orderPreview.id, candidateId);
      router.push(`/dashboard/chat/${chatId}`);
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося відкрити чат");
    }
  };

  const handleRejectExecutorClick = (proposalId: string) => {
    setProposalToReject(proposalId);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!proposalToReject) return;

    try {
      setIsRejecting(true);
      await orderService.rejectExecutor(orderPreview.id, proposalToReject);
      toast.success("Пропозицію відхилено");

      // Update UI
      setFullOrder((prev: any) => ({
        ...prev,
        consultants: prev.consultants.filter((c: any) => c.id !== proposalToReject)
      }));

      setIsRejectModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося відхилити пропозицію");
    } finally {
      setIsRejecting(false);
      setProposalToReject(null);
    }
  };

  // ОНОВЛЕНИЙ Рендер картки консультанта (горизонтальний вигляд)
  const renderConsultantCard = (consultant: any) => (
    <Card key={consultant.id} className="group overflow-hidden border hover:shadow-md transition-shadow p-4">
      <div className="flex items-center gap-4">

        {/* Аватар */}
        <Avatar className="h-12 w-12 border-2 border-primary/10">
          <AvatarImage src={consultant.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {consultant.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Інфо про виконавця (Центр) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate text-foreground">{consultant.name}</h4>
            {consultant.isVerified && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{consultant.rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div>{consultant.completedProjects} робіт</div>
          </div>
        </div>

        {/* Права частина: Ціна + Кнопка (тільки іконка) */}
        <div className="flex items-center gap-4">
          {/* Блок ціни */}
          <div className="text-right flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Пропозиція:</span>
            <span className="font-bold text-green-600 text-base">
              {formatPrice(consultant.price, false)}
            </span>
          </div>

          {/* Кнопка Чату (тільки для Клієнта) */}
          {userRole === 'Client' && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-muted-foreground/20 hover:border-red-500 hover:text-red-500 transition-colors"
                onClick={() => handleRejectExecutorClick(consultant.id)}
                title="Відхилити"
              >
                <Ban className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-muted-foreground/20 hover:border-primary hover:text-primary transition-colors"
                onClick={() => handleOpenChat(consultant.userId)}
                title="Відкрити чат"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

      </div>
    </Card>
  );

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full bg-card group">

      {/* --- HEADER --- */}
      <div className="p-6 border-b relative">
        <div className="flex justify-between items-start gap-4">

          {/* LEFT: Title, Price, Meta */}
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground leading-tight pr-4">
                {orderPreview.title}
              </h3>

              {/* RIGHT: Status & Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {orderPreview.status && (
                  <Badge variant="outline" className={cn(
                    "whitespace-nowrap",
                    orderPreview.status === 'New'
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {orderPreview.status === 'New' ? 'Нове' :
                      orderPreview.status === 'InProgress' ? 'В роботі' :
                        orderPreview.status === 'Completed' ? 'Виконано' :
                          orderPreview.status}
                  </Badge>
                )}

                {userRole === 'Client' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted -mr-2">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Pencil className="w-4 h-4 mr-2" /> Редагувати
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash className="w-4 h-4 mr-2" /> Видалити
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(orderPreview.price, orderPreview.isNegotiable)}
            </div>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary" className="font-normal text-xs">
                {orderPreview.disciplineName}
              </Badge>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-xs font-mono">#{orderPreview.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-muted/20">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent p-0">
            <TabsTrigger
              value="task"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full font-medium text-base bg-transparent shadow-none transition-none"
            >
              Завдання
            </TabsTrigger>

            <TabsTrigger
              value="consultants"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full font-medium text-base bg-transparent shadow-none transition-none overflow-visible"
            >
              <div className="relative">
                <span>Виконавці</span>

                {/* Індикатор кількості */}
                {!isLoading && fullOrder?.consultants?.length > 0 && (
                  <span className="absolute inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-background rounded-full -top-2 -right-4">
                    {fullOrder.consultants.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ===== ТАБ 1: ЗАВДАННЯ ===== */}
        <TabsContent value="task" className="flex-1 p-0 m-0 overflow-visible animate-in fade-in-50">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-md p-3 bg-background/50">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Створено</div>
                <div className="font-medium text-sm flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDateTime(orderPreview.createdAt)}
                </div>
              </div>
              <div className="border rounded-md p-3 bg-background/50">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Дедлайн</div>
                <div className="font-medium text-sm flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(orderPreview.deadline)}
                </div>
              </div>
              <div className="border rounded-md p-3 bg-background/50">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Тип</div>
                <div className="font-medium text-sm">
                  {orderPreview.workTypeName}
                </div>
              </div>
              <div className="border rounded-md p-3 bg-background/50">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Переглядів</div>
                <div className="font-medium text-sm flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  {fullOrder?.viewsCount || orderPreview.viewsCount || 0}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-base font-semibold mb-2 text-foreground">Опис завдання:</h4>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className={cn(
                      "transition-all duration-300",
                      !isDescExpanded && fullOrder?.description?.length > 300 && "line-clamp-4 mask-linear-fade"
                    )}>
                      {fullOrder?.description || "Опис відсутній"}
                    </div>

                    {!isDescExpanded && fullOrder?.description?.length > 300 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 w-full h-7 text-primary hover:text-primary/80 hover:bg-transparent text-xs"
                        onClick={() => setIsDescExpanded(true)}
                      >
                        <ChevronDown className="w-3.5 h-3.5 mr-1" /> Читати повністю
                      </Button>
                    )}
                    {isDescExpanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-muted-foreground hover:bg-transparent text-xs"
                        onClick={() => setIsDescExpanded(false)}
                      >
                        <ChevronUp className="w-3.5 h-3.5 mr-1" /> Згорнути
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-base font-semibold mb-3 text-foreground">Прикріплені файли:</h4>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Завантаження...</span>
                </div>
              ) : fullOrder?.attachments?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fullOrder.attachments.map((file: any) => (
                    <div key={file.id} className="border rounded-md p-2.5 hover:bg-muted/50 transition-colors bg-background flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-blue-600 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate" title={file.originalFileName}>
                          {file.originalFileName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Файл</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                        <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded-lg bg-muted/20 border-dashed">
                  <p className="text-xs text-muted-foreground">Файли не прикріплені</p>
                </div>
              )}
            </div>

            {userRole === 'Executor' && (
              <div className="pt-2 flex gap-3">
                <Button
                  variant="default"
                  className="flex-1 h-11 text-base font-semibold shadow-sm"
                  size="lg"
                  onClick={handleTakeOrderClick}
                  disabled={isCheckingChat}
                >
                  {isCheckingChat ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Взяти замовлення
                </Button>

                <Button
                  variant="outline"
                  className="h-11 w-11 shrink-0"
                  size="icon"
                  onClick={() => handleOpenChat()}
                  title="Написати повідомлення"
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                </Button>
              </div>
            )}

            {/* Modal for Taking Order */}
            <TakeOrderModal
              isOpen={isTakeOrderModalOpen}
              onClose={() => setIsTakeOrderModalOpen(false)}
              onSubmit={handleTakeOrderSubmit}
              showCommentInput={!hasChatHistory}
              initialPrice={orderPreview.price || 0}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Видалити замовлення?</DialogTitle>
                  <DialogDescription>
                    Цю дію неможливо скасувати. Замовлення буде видалено назавжди.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                    Скасувати
                  </Button>
                  <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                    Видалити
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* ===== ТАБ 2: ВИКОНАВЦІ (Оновлено для списку) ===== */}
        <TabsContent value="consultants" className="flex-1 p-0 m-0 overflow-auto animate-in fade-in-50">
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">

                {fullOrder?.consultants?.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/5">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h4 className="font-medium mb-1 text-foreground">Поки що ніхто не відгукнувся</h4>
                    <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                      Очікуйте пропозицій від експертів.
                    </p>
                    {userRole === 'Executor' && (
                      <Button size="sm" className="mt-4" onClick={handleTakeOrderClick} disabled={isCheckingChat}>
                        {isCheckingChat ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Стати першим
                      </Button>
                    )}
                  </div>
                ) : (
                  // ОНОВЛЕНО: Використовуємо вертикальний стек (space-y-3) замість Grid
                  <div className="flex flex-col space-y-3">
                    {fullOrder?.consultants?.map(renderConsultantCard)}
                  </div>
                )}


              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Відхилити кандидата?</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете відхилити цього кандидата? Він більше не зможе подати заявку на це замовлення.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={isRejecting}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={isRejecting}>
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Відхилити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}