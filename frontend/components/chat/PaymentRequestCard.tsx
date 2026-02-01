import { PaymentRequest, paymentService } from '@/services/paymentService';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Check, X, AlertCircle, CreditCard, Clock } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface PaymentRequestCardProps {
    request: PaymentRequest;
    userRole: 'Client' | 'Executor';
    onUpdate: () => void;
}

export function PaymentRequestCard({ request, userRole, onUpdate }: PaymentRequestCardProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            await paymentService.uploadReceipt(request.id, file);
            toast.success('Чек завантажено успішно');
            onUpdate();
        } catch (error) {
            toast.error('Помилка завантаження чека');
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            await paymentService.confirmPayment(request.id);
            toast.success('Оплату підтверджено');
            onUpdate();
        } catch (error) {
            toast.error('Помилка підтвердження');
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        try {
            await paymentService.rejectPayment(request.id, { reason: rejectReason });
            toast.success('Оплату відхилено');
            setRejectDialogOpen(false);
            onUpdate();
        } catch (error) {
            toast.error('Помилка відхилення');
        }
    };

    const statusColors = {
        Pending: 'bg-yellow-100 text-yellow-800',
        MarkedAsPaid: 'bg-blue-100 text-blue-800',
        Confirmed: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
        Pending: 'Очікує оплати',
        MarkedAsPaid: 'Очікує підтвердження',
        Confirmed: 'Оплачено',
        Rejected: 'Відхилено'
    };

    return (
        <Card className="w-full text-sm border-l-4 border-l-primary shadow-sm">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span>Запит на оплату</span>
                    </div>
                    <Badge variant="outline" className={statusColors[request.status]}>
                        {statusLabels[request.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 py-2 space-y-3">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>{request.amount} ₴</span>
                </div>

                {request.comment && (
                    <p className="text-muted-foreground italic text-xs">"{request.comment}"</p>
                )}

                <div className="bg-muted p-2 rounded text-xs space-y-1">
                    <p className="font-medium text-muted-foreground">Реквізити:</p>
                    <div className="flex justify-between">
                        <span>Карта:</span>
                        <span className="font-mono">{request.cardNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Власник:</span>
                        <span className="uppercase">{request.cardOwnerName}</span>
                    </div>
                </div>

                {request.receiptUrl && (
                    <div className="text-xs">
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Check className="w-3 h-3" /> Чек додано
                        </span>
                        {/* Link to view receipt if needed */}
                    </div>
                )}

                {request.status === 'Rejected' && request.rejectReason && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        Причина відхилення: {request.rejectReason}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-2 flex flex-col gap-2">
                {userRole === 'Client' && request.status === 'Pending' && (
                    <>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                        <Button onClick={handleUploadClick} disabled={isUploading} className="w-full h-8 text-xs" variant="outline">
                            {isUploading ? 'Завантаження...' : (
                                <>
                                    <Upload className="w-3 h-3 mr-2" />
                                    Завантажити чек
                                </>
                            )}
                        </Button>
                    </>
                )}

                {userRole === 'Client' && request.status === 'Rejected' && (
                    <p className="text-xs text-center text-muted-foreground">
                        Оплату відхилено. Створіть новий запит або зв'яжіться з виконавцем.
                    </p>
                )}

                {userRole === 'Executor' && request.status === 'MarkedAsPaid' && (
                    <div className="flex gap-2 w-full">
                        <Button onClick={handleConfirm} className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white">
                            <Check className="w-3 h-3 mr-1" /> Підтвердити
                        </Button>
                        <Button onClick={() => setRejectDialogOpen(true)} className="flex-1 h-8 text-xs" variant="destructive">
                            <X className="w-3 h-3 mr-1" /> Відхилити
                        </Button>
                    </div>
                )}

                {request.status === 'Confirmed' && (
                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Оплата завершена {request.paidAt ? new Date(request.paidAt).toLocaleDateString() : ''}
                    </p>
                )}
            </CardFooter>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Відхилення оплати</DialogTitle>
                        <DialogDescription>
                            Вкажіть причину, чому ви відхиляєте цей платіж (наприклад, не надійшли кошти).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Причина</Label>
                            <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Кошти не надійшли..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Скасувати</Button>
                        <Button variant="destructive" onClick={handleReject}>Відхилити</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
