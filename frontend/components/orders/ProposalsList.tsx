import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService';
import api from '@/lib/axios';
import Link from 'next/link';

interface ProposalsListProps {
    orderId: string;
    onExecutorAccepted: () => void;
}

export default function ProposalsList({ orderId, onExecutorAccepted }: ProposalsListProps) {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadProposals();
    }, [orderId]);

    const loadProposals = async () => {
        try {
            setLoading(true);
            const data = await orderService.getProposals(orderId);
            setProposals(data);
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Помилка при завантаженні ставок');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (proposalId: string) => {
        setIsAccepting(prev => ({ ...prev, [proposalId]: true }));
        try {
            await api.post(`/Orders/${orderId}/accept-executor`, { proposalId });
            toast.success('Виконавця обрано!');
            onExecutorAccepted();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Помилка при виборі виконавця');
        } finally {
            setIsAccepting(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    if (loading) {
        return <div className="text-center p-4">Завантаження ставок...</div>;
    }

    if (proposals.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Ставки від виконавців</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Поки немає жодної ставки.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Ставки від виконавців ({proposals.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {proposals.map((p) => (
                    <Card key={p.id} className="border bg-muted/30">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Link href={`/dashboard/users/${p.executorId}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 -m-2 rounded-lg transition-colors cursor-pointer group">
                                    {p.executorAvatar ? (
                                        <img src={p.executorAvatar} alt={p.executorUserName || p.executorName} className="w-10 h-10 rounded-full object-cover group-hover:ring-2 ring-primary/30 transition-all" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold group-hover:ring-2 ring-primary/40 transition-all">
                                            {(p.executorUserName || p.executorName).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                                            {p.executorUserName ? `@${p.executorUserName}` : p.executorName}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Рейтинг: {p.executorRating.toFixed(1)} | Виконано: {p.executorCompletedProjects}
                                        </p>
                                    </div>
                                </Link>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{p.price} ₴</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <p className="text-sm whitespace-pre-wrap">{p.comment}</p>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={() => handleAccept(p.id)}
                                disabled={isAccepting[p.id]}
                                className="w-full"
                            >
                                {isAccepting[p.id] ? "Прийняття..." : "Обрати виконавцем"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}
