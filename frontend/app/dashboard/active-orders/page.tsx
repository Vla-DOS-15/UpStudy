'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { MessageSquare, Clock, FileText, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Download, LayoutList, List } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { chatService } from '@/services/chatService';

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
  clientName?: string;
  executorId?: string;
  hasMyProposal?: boolean;
  myProposalId?: string;
}

interface Attachment {
  id: string;
  originalFileName: string;
  downloadUrl: string;
}

interface OrderDetails extends OrderPreview {
  description: string;
  attachments: Attachment[];
}

import { PAGE_SIZE } from '@/lib/constants';
import { generatePagination } from '@/lib/utils';

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<OrderPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in-progress');
  
  // Pagination & Infinite Scroll states
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  
  const loaderRef = useRef<HTMLDivElement>(null);

  // Helper to map tab to status
  const getStatusForTab = (tab: string) => {
    switch (tab) {
      case 'in-progress': return 'InProgress';
      case 'review': return 'Review';
      case 'completed': return 'Completed';
      default: return 'InProgress';
    }
  };

  const fetchOrders = async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      const status = getStatusForTab(activeTab);
      const data = await orderService.getMyOrders({ page: pageNum, pageSize: PAGE_SIZE, status });
      
      setTotalPages(Math.ceil(data.totalCount / data.pageSize));
      setHasMore(pageNum * data.pageSize < data.totalCount);
      
      if (isLoadMore) {
        setOrders(prev => [...prev, ...data.items]);
      } else {
        setOrders(data.items);
      }
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося завантажити замовлення');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchOrders(1, false);
  }, [activeTab, viewMode]);
  
  useEffect(() => {
    if (page > 1) {
      fetchOrders(page, viewMode === 'infinite');
    }
  }, [page]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (viewMode !== 'infinite' || isLoading || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, isLoading, isLoadingMore, hasMore]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const isClient = user?.roles?.includes('Client');

  const handleChat = async (order: OrderPreview) => {
    try {
      let candidateId: string | undefined;
      // Логіка переходу в чат
      // Якщо я Клієнт - мені треба вказати candidateId (виконавця)
      // Якщо я Виконавець - бекенд сам знає що я кандидат
      if (isClient) {
        if (order.executorId) {
          candidateId = order.executorId;
        } else {
          toast.error('Виконавця не знайдено, неможливо відкрити чат');
          return;
        }
      }

      const { chatId } = await chatService.initChat(order.id, candidateId);
      router.push(`/dashboard/chat/${chatId}`);
    } catch (error) {
      console.error(error);
      toast.error('Не вдалося відкрити чат');
    }
  };

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysLeft = differenceInDays(date, new Date());
    const formattedDate = format(date, 'd MMMM yyyy', { locale: uk });

    let daysText = '';
    if (daysLeft < 0) daysText = '(прострочено)';
    else if (daysLeft === 0) daysText = '(сьогодні)';
    else daysText = `(через ${daysLeft} дн.)`;

    return `${formattedDate} ${daysText}`;
  };

  // Компонент картки замовлення
  const OrderCard = ({ order }: { order: OrderPreview }) => {
    const [fullOrder, setFullOrder] = useState<OrderDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    useEffect(() => {
      let isMounted = true;
      const fetchDetails = async () => {
        try {
          const details = await orderService.getOrderById(order.id);
          if (isMounted) setFullOrder(details);
        } catch (error) {
          console.error(error);
        } finally {
          if (isMounted) setIsLoadingDetails(false);
        }
      };
      fetchDetails();
      return () => { isMounted = false; };
    }, [order.id]);

    return (
      <Card className="hover:shadow-md transition-shadow duration-300 flex flex-col h-full bg-card group p-0 gap-0 overflow-hidden">
        <div className="p-4 border-b relative bg-muted/5">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight min-w-0 break-words">
                  {order.title}
                </h3>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0 h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary border-primary/20" 
                  onClick={() => handleChat(order)} 
                  title="Відкрити чат"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-end justify-between mt-1">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {order.price ? `${order.price} ₴` : 'Договірна'}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1.5 w-full">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="font-medium text-[10.5px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 border-transparent transition-colors">
                    <FileText className="w-3 h-3 mr-1" />
                    {order.workTypeName || 'Не вказано'}
                  </Badge>
                  <Badge variant="secondary" className={`font-medium text-[10.5px] px-2 py-0.5 border-transparent transition-colors ${new Date(order.deadline) < new Date() ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-400' : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDeadline(order.deadline)}
                  </Badge>
                  <Badge variant="outline" className="font-medium text-[10.5px] px-2 py-0.5 text-muted-foreground border-muted-foreground/30 hover:bg-muted/50 transition-colors">
                    {order.disciplineName}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-1">
                  <span className="font-mono">#{order.orderNumber || order.id?.substring(0, 8)}</span>
                  <span>•</span>
                  <span>
                    {isClient ? `Виконавець: ID ${order.executorId?.substring(0, 8) || '...'}` : `Замовник: ${order.clientName}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4 bg-background">
          <div>
            <h4 className="text-sm font-semibold mb-1.5 text-foreground">Опис завдання:</h4>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
              {isLoadingDetails ? (
                <div className="space-y-2 py-1">
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className={`transition-all duration-300 ${!isDescExpanded && (fullOrder?.description?.length ?? 0) > 200 ? 'line-clamp-3 mask-linear-fade' : ''}`}>
                    {fullOrder?.description || "Опис відсутній"}
                  </div>
                  {!isDescExpanded && (fullOrder?.description?.length ?? 0) > 200 && (
                    <Button variant="ghost" size="sm" className="mt-1 w-full h-6 text-primary hover:text-primary/80 hover:bg-transparent text-xs" onClick={() => setIsDescExpanded(true)}>
                      <ChevronDown className="w-3.5 h-3.5 mr-1" /> Читати повністю
                    </Button>
                  )}
                  {isDescExpanded && (
                    <Button variant="ghost" size="sm" className="mt-1 h-6 text-muted-foreground hover:bg-transparent text-xs" onClick={() => setIsDescExpanded(false)}>
                      <ChevronUp className="w-3.5 h-3.5 mr-1" /> Згорнути
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {(!isLoadingDetails && (fullOrder?.attachments?.length ?? 0) > 0) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Прикріплені файли:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fullOrder?.attachments?.map((file: any) => (
                    <div key={file.id} className="border rounded-md p-2 hover:bg-muted/50 transition-colors bg-background flex items-center gap-2">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate" title={file.originalFileName}>
                          {file.originalFileName}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0" asChild>
                        <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                          <Download className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );

  const renderOrdersList = () => {
    if (isLoading && orders.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (orders.length === 0) {
      return <EmptyState text="Замовлень не знайдено" />;
    }

    return (
      <div className="space-y-4">
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
        
        {/* Infinite Scroll Loader */}
        {viewMode === 'infinite' && hasMore && (
          <div ref={loaderRef} className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {/* Pagination Controls */}
        {viewMode === 'pagination' && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {generatePagination(page, totalPages).map((p, i) => (
                  <PaginationItem key={i}>
                    {p === '...' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => setPage(p as number)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 container max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">В роботі</h2>
        
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md bg-muted/30 p-1">
          <Button
            variant={viewMode === 'pagination' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pagination')}
            className="text-xs h-8 px-3 flex items-center gap-1"
          >
            <List className="w-4 h-4" /> Сторінки
          </Button>
          <Button
            variant={viewMode === 'infinite' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('infinite')}
            className="text-xs h-8 px-3 flex items-center gap-1"
          >
            <LayoutList className="w-4 h-4" /> Стрічка
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="in-progress">Виконуються</TabsTrigger>
          <TabsTrigger value="review">На перевірці</TabsTrigger>
          <TabsTrigger value="completed">Завершені</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-6">
          {renderOrdersList()}
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          {renderOrdersList()}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderOrdersList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}