'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Clock, CalendarDays, Eye, FileText, Download,
  Loader2, Users, MessageSquare, ChevronDown, ChevronUp,
  UserCircle, Award, Star, CheckCircle, MoreVertical, Pencil, Trash, Edit, StarHalf
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

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
import { useAuth } from '@/context/AuthContext';

interface OrderPreview {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  price?: number;
  isNegotiable: boolean;
  deadline: string;
  createdAt: string;
  disciplineName: string;
  workTypeName: string;
  viewsCount?: number;
  clientId?: string;
  hasMyProposal?: boolean;
  myProposalId?: string;
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
  const { user } = useAuth();

  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [detailsData, proposalsData] = await Promise.all([
          orderService.getOrderById(orderPreview.id),
          orderService.getProposals(orderPreview.id).catch(() => [])
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

    if (user?.id) {
        fetchData();
    }

    return () => { isMounted = false; };
  }, [orderPreview.id, orderPreview.clientId, user?.id]);

  const formatPrice = (price?: number, isNegotiable?: boolean) => {
    if (isNegotiable) return 'Договірна';
    if (!price) return '0 ₴';
    return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(price) + ' ₴';
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Не вказано';
    return format(new Date(dateString), 'd MMMM yyyy, HH:mm', { locale: uk });
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'Не вказано';
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: uk });
  };

  // Дії: Редагування/Видалення (тільки для Клієнта)
  const handleEdit = () => {
    // Переходимо на сторінку створення з параметром edit
    router.push(`/dashboard/create-order?edit=${orderPreview.id}`);
  };

  const handleCompleteOrderClick = () => {
    setIsCompleteModalOpen(true);
  };

  const onConfirmComplete = async () => {
    try {
      setIsCompleting(true);
      await orderService.completeOrder(orderPreview.id);
      toast.success('Завдання успішно завершено!');
      setIsCompleteModalOpen(false);
      setIsReviewModalOpen(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.Error || 'Не вдалося завершити завдання');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkipReview = () => {
    setIsReviewModalOpen(false);
    window.location.reload();
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      await orderService.leaveReview(orderPreview.id, { rating: reviewRating, text: reviewText });
      toast.success('Відгук успішно додано!');
      setIsReviewModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.Error || 'Не вдалося додати відгук');
    } finally {
      setIsSubmittingReview(false);
    }
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
      // Hide Next.js overlay, handle via toast
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
      // Hide Next.js overlay, show user-friendly message via toast
      toast.error(error.response?.data?.Error || "Не вдалося взяти замовлення");
    }
  };

  const handleOpenChat = async (candidateId?: string) => {
    try {
      const { chatId } = await chatService.initChat(orderPreview.id, candidateId);
      router.push(`/dashboard/chat/${chatId}`);
    } catch (error) {
      // Hide Next.js overlay
      toast.error("Не вдалося відкрити чат");
    }
  };

  const handleCancelProposal = async () => {
    if (!orderPreview.myProposalId) {
      toast.error("Помилка: не знайдено ID заявки");
      return;
    }
    
    try {
      setIsCanceling(true);
      await orderService.deleteProposal(orderPreview.myProposalId);
      toast.success("Заявку успішно скасовано");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.Error || "Не вдалося скасувати заявку");
      setIsCanceling(false);
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

          {/* Кнопка Чату (тільки іконка) */}
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full border-muted-foreground/20 hover:border-primary hover:text-primary transition-colors shrink-0"
            onClick={() => handleOpenChat(consultant.userId)}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* Кнопка прийняття для клієнта */}
          {userRole === 'Client' && !fullOrder?.executorId && (
            <Button
              size="sm"
              className="ml-2 shrink-0"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await orderService.acceptExecutor(orderPreview.id, consultant.id);
                  toast.success("Виконавця обрано! Тепер потрібно сплатити комісію.");
                  // Redirect to order details to pay commission
                  router.push(`/dashboard/orders/${orderPreview.id}`);
                } catch (error: any) {
                  console.error(error);
                  toast.error(error.response?.data?.Error || "Не вдалося обрати виконавця");
                  setIsLoading(false);
                }
              }}
            >
              Обрати
            </Button>
          )}
        </div>

      </div>
    </Card>
  );

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full bg-card group p-0 gap-0 overflow-hidden">

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
          {/* --- HEADER --- */}
          <div className="p-4 border-b relative">
            <div className="flex justify-between items-start gap-4">

              {/* LEFT: Title, Price, Meta */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight min-w-0 break-words">
                    {orderPreview.title}
                  </h3>

                  {/* RIGHT: Price & Menu */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <div className="text-[15px] sm:text-base font-bold text-green-700 dark:text-green-400 whitespace-nowrap bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 rounded-md border border-green-200 dark:border-green-800/50">
                      {formatPrice(orderPreview.price, orderPreview.isNegotiable)}
                    </div>

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
                          {(orderPreview.status === 'InProgress' || orderPreview.status === 'Review') && (
                            <DropdownMenuItem onClick={handleCompleteOrderClick} className="text-green-600 focus:text-green-600 focus:bg-green-50">
                              <CheckCircle className="w-4 h-4 mr-2" /> Завершити завдання
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash className="w-4 h-4 mr-2" /> Видалити
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="flex flex-col gap-2 pt-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-medium text-[10.5px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 border-transparent transition-colors">
                      <FileText className="w-3 h-3 mr-1" />
                      {orderPreview.workTypeName}
                    </Badge>
                    <Badge variant="secondary" className="font-medium text-[10.5px] px-2 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 border-transparent transition-colors">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(orderPreview.deadline)}
                    </Badge>
                    <Badge variant="outline" className="font-medium text-[10.5px] px-2 py-0.5 text-muted-foreground border-muted-foreground/30 hover:bg-muted/50 transition-colors">
                      {orderPreview.disciplineName}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <span className="font-mono">#{orderPreview.orderNumber}</span>
                      <span>•</span>
                      <span>від {formatDateOnly(orderPreview.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <Eye className="w-3.5 h-3.5" />
                      {fullOrder?.viewsCount || orderPreview.viewsCount || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
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

            {/* Actions for Task (Client or Executor) */}
            {userRole === 'Client' && (
              <div className="pt-2 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 text-base font-medium border-primary/20 hover:bg-primary/5" size="lg" asChild>
                  <Link href={`/dashboard/edit-order/${orderPreview.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Редагувати
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 h-11 text-base font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20" size="lg" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash className="w-4 h-4 mr-2" />
                  Видалити
                </Button>
              </div>
            )}
            
            {userRole === 'Executor' && (
              <div className="pt-2 flex gap-3">
                {orderPreview.hasMyProposal ? (
                  <Button
                    variant="secondary"
                    className="flex-1 h-11 text-base font-semibold shadow-sm group hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    size="lg"
                    disabled={isCanceling}
                    onClick={handleCancelProposal}
                  >
                    {isCanceling ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <>
                        <span className="group-hover:hidden flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Ви вже подали заявку
                        </span>
                        <span className="hidden group-hover:flex items-center justify-center">
                          <Trash className="w-4 h-4 mr-2" />
                          Скасувати заявку
                        </span>
                      </>
                    )}
                  </Button>
                ) : (
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
                )}
                
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
                      orderPreview.hasMyProposal ? (
                        <div className="mt-4 flex items-center justify-center text-sm font-medium text-green-600 bg-green-50 px-3 py-2 rounded-md w-max mx-auto border border-green-200">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ви вже подали заявку
                        </div>
                      ) : (
                        <Button size="sm" className="mt-4" onClick={handleTakeOrderClick} disabled={isCheckingChat}>
                          {isCheckingChat ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Стати першим
                        </Button>
                      )
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

      {/* Complete Order Confirmation Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершити завдання?</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете завершити завдання? Зарезервовані кошти будуть автоматично перераховані виконавцю. Цю дію неможливо скасувати.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)} disabled={isCompleting}>
              Скасувати
            </Button>
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={onConfirmComplete} 
              disabled={isCompleting}
            >
              {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Завершити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => {
        if (!open) handleSkipReview();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оцініть роботу виконавця</DialogTitle>
            <DialogDescription>
              Поділіться своїми враженнями від співпраці. Ваша оцінка допоможе іншим замовникам.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">Оцінка:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-colors"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8",
                        star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Відгук (необов'язково):</label>
              <Textarea
                placeholder="Напишіть кілька слів про співпрацю..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipReview} disabled={isSubmittingReview}>
              Пропустити
            </Button>
            <Button 
              variant="default" 
              onClick={handleSubmitReview} 
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
              Надіслати відгук
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}