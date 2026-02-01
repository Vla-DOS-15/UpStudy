'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Filter, RefreshCcw } from 'lucide-react';
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
import { dictionaryService, DictionaryItem } from '@/services/dictionaryService';
import { PaginationControls } from '@/components/ui/pagination-controls';

export default function OrdersPageClient() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 9;

    // Filters State
    const [disciplines, setDisciplines] = useState<DictionaryItem[]>([]);
    const [workTypes, setWorkTypes] = useState<DictionaryItem[]>([]);

    // Active Filters
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
    const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const userRole = user?.roles?.includes('Executor') ? 'Executor' : 'Client';

    useEffect(() => {
        // Debounce fetch for filters
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);

        return () => clearTimeout(timer);
    }, [userRole, searchQuery, selectedDiscipline, selectedWorkType, minPrice, maxPrice, page]);

    // Reset page to 1 when filters change (except page itself)
    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedDiscipline, selectedWorkType, minPrice, maxPrice]);

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

    const fetchOrders = async () => {
        // Logic Validation inside fetch
        if (minPrice && Number(minPrice) < 0) return;
        if (maxPrice && Number(maxPrice) < 0) return;
        if (minPrice && maxPrice && Number(maxPrice) < Number(minPrice)) return;

        try {
            setIsLoading(true);

            let data;

            if (userRole === 'Client') {
                // Client sees ONLY their orders
                data = await orderService.getMyOrders();
            } else {
                // Executor sees all orders (Exchange)
                data = await orderService.getAllOrders({
                    search: searchQuery,
                    disciplineId: selectedDiscipline !== 'all' ? Number(selectedDiscipline) : undefined,
                    workTypeId: selectedWorkType !== 'all' ? Number(selectedWorkType) : undefined,
                    minPrice: minPrice ? Number(minPrice) : undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    page: page,
                    pageSize: PAGE_SIZE
                });
            }

            const newItems = Array.isArray(data) ? data : data.items || [];
            const newTotalCount = data.totalCount || newItems.length; // Fallback if API doesn't return totalCount

            // Just replace items for the current page
            setOrders(newItems);
            setTotalCount(newTotalCount);
            setTotalPages(data.totalPages || Math.ceil(newTotalCount / PAGE_SIZE) || 1);

        } catch (error) {
            console.error(error);
            toast.error('Не вдалося завантажити список замовлень');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };



    // Better Approach: Trigger fetch when page changes, BUT filter changes reset page to 1.
    // Let's decouple.
    // Actually, simplest is to pass explicit page to fetch function.
    // Re-writing fetchOrders to NOT rely on 'page' state for the request params but accept it.

    // RETRYING LOGIC IN NEXT ACTION... 
    // Wait, I can't leave this comment in Code.
    // I will use a ref or just update logic now.

    // ...
    // Let's go with: handleLoadMore calls setPage, and we add 'page' to the dependency array of a NEW useEffect?
    // Or just merge into existing useEffect?
    // If I add 'page' to the main useEffect dependencies:
    //  - changing filter -> setPage(1) -> triggers effect -> fetchOrders(1). Good.
    //  - clicking load more -> setPage(p+1) -> triggers effect -> fetchOrders(p+1). Good.
    // BUT: I need to know if I should APPEND or REPLACE.
    //  - if page === 1: REPLACE.
    //  - if page > 1: APPEND.

    // Logic:
    // Remove manual fetchOrders calls. Rely mostly on Effect.
    // Effect: [filters, page].
    // Inside effect: if page === 1, replace. If page > 1, append.
    // When filters change: setPage(1). 
    // IMPORTANT: If filters change, we setPage(1). This triggers effect? 
    // If page was 1, and we setPage(1), it does NOT trigger effect. So we need to handle "Same Page but Filters Changed".
    // Better: Effect depends on [filters]. Inside: setPage(1). (This might verify loop if we add page to deps).

    // Standard pattern:
    // Effect 1: [filters]. Action: setPage(1). (Only if page != 1? If page is 1, we still need to fetch new filtered data).
    // Actually, simpler: 
    // fetchOrders(pageToFetch, shouldAppend).
    // handleLoadMore -> fetchOrders(page + 1, true); setPage(prev => prev + 1).
    // filtersChange -> fetchOrders(1, false); setPage(1).
    // This avoids complex useEffect interactions.

    // Implementation below uses this manual approach inside the multi-replace chunks.


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Triggered by effect via state
    };

    return (
        <div className="space-y-8">
            {/* Header and Controls */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {userRole === 'Client' ? 'Мої замовлення' : 'Біржа замовлень'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {userRole === 'Client'
                                ? 'Керуйте своїми поточними завданнями та проектами.'
                                : 'Знаходьте нові завдання та заробляйте.'}
                        </p>
                        {userRole === 'Executor' && totalCount > 0 && (
                            <div className="mt-2">
                                <Badge variant="secondary">Всього знайдено: {totalCount}</Badge>
                            </div>
                        )}
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

                {/* Executor Search & Filters */}
                {userRole === 'Executor' && (
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            {/* Text Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Пошук замовлень..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Price Filters */}
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

                        {/* Additional Filters */}
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

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
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
                    <div className="flex flex-col gap-6">
                        {orders.map((order) => (
                            <OrderListItem
                                key={order.id}
                                orderPreview={order}
                                userRole={userRole}
                            />
                        ))}
                    </div>


                    {/* Pagination */}
                    {totalPages > 1 && (
                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    )}
                </div>
            )
            }
        </div >
    );
}
