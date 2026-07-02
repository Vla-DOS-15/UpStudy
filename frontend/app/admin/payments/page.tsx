'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectReasons, setRejectReasons] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Admin/commissions/pending');
            setPayments(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Не вдалося завантажити список платежів');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orderId: string) => {
        setIsProcessing((prev) => ({ ...prev, [orderId]: true }));
        try {
            await api.post(`/Admin/commissions/${orderId}/approve`);
            toast.success('Оплату успішно підтверджено!');
            loadPayments();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Помилка при підтвердженні');
        } finally {
            setIsProcessing((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const handleReject = async (orderId: string) => {
        const reason = rejectReasons[orderId] || '';
        if (!reason.trim()) {
            toast.error('Будь ласка, вкажіть причину відхилення');
            return;
        }

        setIsProcessing((prev) => ({ ...prev, [orderId]: true }));
        try {
            await api.post(`/Admin/commissions/${orderId}/reject`, { reason });
            toast.success('Оплату відхилено.');
            loadPayments();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Помилка при відхиленні');
        } finally {
            setIsProcessing((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    if (loading) {
        return <div className="p-8">Завантаження...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Очікують підтвердження оплати</h1>
            {payments.length === 0 ? (
                <p className="text-muted-foreground">Немає очікуючих платежів.</p>
            ) : (
                <div className="grid gap-6">
                    {payments.map((p) => (
                        <Card key={p.orderId}>
                            <CardHeader>
                                <CardTitle className="text-lg">Замовлення: {p.orderTitle}</CardTitle>
                                <p className="text-sm text-muted-foreground">Клієнт: {p.clientName}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="font-semibold text-lg">Сума комісії: {p.commissionAmount} ₴</p>
                                
                                {p.receiptViewUrl ? (
                                    <div className="border rounded-md p-2 max-w-sm">
                                        <p className="mb-2 font-medium">Квитанція:</p>
                                        <a href={p.receiptViewUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={p.receiptViewUrl} alt="Квитанція" className="w-full h-auto object-cover rounded" />
                                        </a>
                                        <p className="text-xs text-muted-foreground mt-1">Натисніть на зображення, щоб відкрити повністю</p>
                                    </div>
                                ) : (
                                    <p className="text-red-500">Квитанція відсутня!</p>
                                )}

                                <div className="flex gap-4 items-end mt-4">
                                    <Button 
                                        onClick={() => handleApprove(p.orderId)} 
                                        disabled={isProcessing[p.orderId]}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Підтвердити оплату
                                    </Button>

                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Причина відхилення" 
                                            value={rejectReasons[p.orderId] || ''} 
                                            onChange={(e) => setRejectReasons(prev => ({ ...prev, [p.orderId]: e.target.value }))}
                                            className="w-64"
                                        />
                                        <Button 
                                            variant="destructive" 
                                            onClick={() => handleReject(p.orderId)}
                                            disabled={isProcessing[p.orderId]}
                                        >
                                            Відхилити
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
