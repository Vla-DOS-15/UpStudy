'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Ban, Trash2, Loader2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { orderService } from '@/services/orderService';

export default function RejectedOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const data = await orderService.getMyProposals();
            // Filter for Rejected
            setOrders(data.filter((o: any) => o.myProposalStatus === 'Rejected'));
        } catch (error) {
            console.error(error);
            toast.error('Не вдалося завантажити відхилені замовлення');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProposal = async (proposalId: string) => {
        try {
            await orderService.deleteProposal(proposalId);
            toast.success('Пропозицію видалено зі списку');
            // Remove from list
            setOrders(prev => prev.filter(o => o.myProposalId !== proposalId));
        } catch (error) {
            console.error(error);
            toast.error('Не вдалося видалити пропозицію');
        }
    };

    const EmptyState = () => (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
            <Ban className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Список відхилених порожній</p>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 container max-w-5xl mx-auto py-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">Відхилені</h2>
            </div>

            <div className="space-y-4">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <Card key={order.id} className="hover:shadow-md transition-shadow border-red-100 dark:border-red-900/30">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <CardTitle className="text-xl mb-1 line-clamp-1" title={order.title}>
                                            {order.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <span className="font-medium text-foreground/80">
                                                {order.disciplineName}
                                            </span>
                                            <span>•</span>
                                            <span>Замовник: {order.clientName}</span>
                                        </CardDescription>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Ваша ставка</span>
                                        <span className="text-lg font-bold text-muted-foreground line-through decoration-red-500 decoration-2">{order.myPrice} ₴</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 text-red-500">
                                        <Ban className="w-4 h-4" />
                                        <span className="font-medium">Вашу пропозицію було відхилено (або обрано іншого виконавця)</span>
                                    </div>

                                    <Separator />

                                    {/* Файли */}
                                    {order.attachments && order.attachments.length > 0 && (
                                        <div>
                                            <span className="font-semibold text-foreground block mb-2">Прикріплені файли:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {order.attachments.map((file: any) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors border text-sm"
                                                    >
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                        <span className="truncate max-w-[200px]">{file.originalFileName}</span>
                                                        <Download className="w-3 h-3 opacity-50" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/5 flex justify-end p-4 rounded-b-xl border-t">
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteProposal(order.myProposalId)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Видалити зі списку
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}
