'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, RefreshCcw, Loader2, LayoutList, List } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import OrderListItem from '@/components/orders/OrderListItem';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dictionaryService, DictionaryItem } from '@/services/dictionaryService';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

import { PAGE_SIZE } from '@/lib/constants';
import { generatePagination } from '@/lib/utils';

export default function OrdersPageClient() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination & Infinite Scroll
    const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    // Filters State
    const [disciplines, setDisciplines] = useState<DictionaryItem[]>([]);
    const [workTypes, setWorkTypes] = useState<DictionaryItem[]>([]);

    // Active Filters
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
    const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const userRole = user?.roles?.includes('Executor') ? 'Executor' : 'Client';
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        // Debounce fetch for filters
        const timer = setTimeout(() => {
            setPage(1);
            fetchOrders(1, false);
        }, 500);

        return () => clearTimeout(timer);
    }, [userRole, searchQuery, selectedDiscipline, selectedWorkType, minPrice, maxPrice, activeTab, viewMode]);

    useEffect(() => {
        if (page > 1) {
            fetchOrders(page, viewMode === 'infinite');
        }
    }, [page]);

    // Load Dictionaries
    useEffect(() => {
        const loadDictionaries = async () => {
            try {
                const [d, w] = await Promise.all([
                    dictionaryService.getDisciplines(),
                    dictionaryService.getWorkTypes()
                ]);
                setDisciplines(d);
                setWorkTypes(w);
            } catch (e) {
                console.error("Failed to load dictionaries", e);
            }
        };
        loadDictionaries();
    }, []);

    const fetchOrders = async (pageNum: number, isLoadMore = false) => {
        // Logic Validation inside fetch to prevent bad requests
        if (minPrice && Number(minPrice) < 0) return;
        if (maxPrice && Number(maxPrice) < 0) return;
        if (minPrice && maxPrice && Number(maxPrice) < Number(minPrice)) return;

        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            let data;

            if (userRole === 'Client') {
                const status = activeTab !== 'all' ? activeTab : undefined;
                data = await orderService.getMyOrders({
                    page: pageNum,
                    pageSize: PAGE_SIZE,
                    status
                });
            } else {
                data = await orderService.getAllOrders({
                    search: searchQuery,
                    disciplineId: selectedDiscipline !== 'all' ? Number(selectedDiscipline) : undefined,
                    workTypeId: selectedWorkType !== 'all' ? Number(selectedWorkType) : undefined,
                    minPrice: minPrice ? Number(minPrice) : undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    page: pageNum,
                    pageSize: PAGE_SIZE
                });
            }

            const newItems = Array.isArray(data) ? data : data.items || [];
            const totalCount = data.totalCount || 0;

            setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
            setHasMore(pageNum * PAGE_SIZE < totalCount);

            if (isLoadMore) {
                setOrders(prev => [...prev, ...newItems]);
            } else {
                setOrders(newItems);
            }
        } catch (error) {
            console.error(error);
            toast.error('Не вдалося завантажити список замовлень');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchOrders(1, false);
    };

    return (
        <div className="space-y-8">
            {/* Хедер і Контроли */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {userRole === 'Client' ? 'Мої замовлення' : 'Біржа замовлень'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {userRole === 'Client'
                                ? 'Керуйте своїми поточними завданнями та проектами.'
                                : 'Знаходьте нові завдання та заробляйте.'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
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

                        {userRole === 'Client' && (
                            <Button asChild className="shrink-0">
                                <Link href="/dashboard/create-order">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Створити замовлення
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Пошук для Виконавця */}
                {userRole === 'Executor' && (
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            {/* Текстовий пошук */}
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Пошук замовлень..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Фільтри Цін */}
                            <div className="flex gap-2 shrink-0">
                                <Input
                                    placeholder="Мін. ціна"
                                    type="number"
                                    className="w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                                    min={0}
                                    value={minPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || Number(val) >= 0) setMinPrice(val);
                                    }}
                                />
                                <Input
                                    placeholder="Макс. ціна"
                                    type="number"
                                    className="w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={0}
                                    value={maxPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || Number(val) >= 0) setMaxPrice(val);
                                    }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary">
                                    Пошук
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => {
                                    setSearchQuery('');
                                    setMinPrice('');
                                    setMaxPrice('');
                                    setSelectedDiscipline('all');
                                    setSelectedWorkType('all');
                                }} title="Скинути">
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Додаткові Фільтри (Дисципліна/Тип) */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-[200px]">
                                <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Всі дисципліни" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Всі дисципліни</SelectItem>
                                        {disciplines.map(d => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-[200px]">
                                <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Всі типи робіт" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Всі типи робіт</SelectItem>
                                        {workTypes.map(w => (
                                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Список */}
            <div className="flex flex-col gap-6">
                {userRole === 'Client' && (
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
                            <TabsTrigger value="all">Всі</TabsTrigger>
                            <TabsTrigger value="New">Нові</TabsTrigger>
                            <TabsTrigger value="InProgress">В процесі</TabsTrigger>
                            <TabsTrigger value="Review">На перевірці</TabsTrigger>
                            <TabsTrigger value="Completed">Завершені</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {isLoading && orders.length === 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {orders.length === 0 ? (
                            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[300px]">
                                <div className="bg-muted/50 p-4 rounded-full mb-4">
                                    <Search className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {userRole === 'Client' ? 'У вас ще немає замовлень' : 'Замовлень не знайдено'}
                                </h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    {userRole === 'Client'
                                        ? "Створіть своє перше замовлення, щоб знайти виконавців."
                                        : "Спробуйте змінити параметри пошуку або завітайте пізніше."}
                                </p>
                                {userRole === 'Client' && (
                                    <Button asChild variant="outline">
                                        <Link href="/dashboard/create-order">Створити перше замовлення</Link>
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
                                    {orders.map((order) => (
                                        <OrderListItem
                                            key={order.id}
                                            orderPreview={order}
                                            userRole={userRole}
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
                    </>
                )}
            </div>
        </div>
    );
}
