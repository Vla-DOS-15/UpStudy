'use client';

import React, { useEffect, useState, useRef } from 'react';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import OrderListItem from '@/components/orders/OrderListItem';
import { Clock, LayoutList, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { generatePagination } from '@/lib/utils';

import { PAGE_SIZE } from '@/lib/constants';

export default function PendingOrdersClient() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Pagination & Infinite Scroll states
    const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchPendingOrders = async (pageNum: number, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            const data = await orderService.getPendingOrders({ page: pageNum, pageSize: PAGE_SIZE });

            const totalCount = data.totalCount || 0;
            const items = data.items || [];

            setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
            setHasMore(pageNum * PAGE_SIZE < totalCount);

            if (isLoadMore) {
                setOrders(prev => [...prev, ...items]);
            } else {
                setOrders(items);
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
        fetchPendingOrders(1, false);
    }, [viewMode]);

    useEffect(() => {
        if (page > 1) {
            fetchPendingOrders(page, viewMode === 'infinite');
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">В очікуванні</h1>
                    <p className="text-muted-foreground mt-2">
                        Завдання, на які ви подали заявку, але замовник ще не обрав виконавця.
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-md bg-muted/30 p-1 shrink-0">
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

            {isLoading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p>Завантаження...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-card shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Немає завдань в очікуванні</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Ви ще не подали жодної заявки, яка очікує на рішення. Перейдіть на біржу, щоб знайти нові замовлення.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <OrderListItem
                                key={order.id}
                                orderPreview={order}
                                userRole="Executor"
                            />
                        ))}
                    </div>

                    {/* Infinite Scroll Loader */}
                    {viewMode === 'infinite' && hasMore && (
                        <div ref={loaderRef} className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {viewMode === 'pagination' && totalPages > 1 && (
                        <div className="mt-8 pb-8">
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
            )}
        </div>
    );
}
