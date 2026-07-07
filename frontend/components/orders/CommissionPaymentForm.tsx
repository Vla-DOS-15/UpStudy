import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface CommissionPaymentFormProps {
    orderId: string;
    commissionAmount: number;
    status: number; // 0 = None, 1 = Submitted, 2 = Approved, 3 = Rejected
    rejectReason?: string;
    onPaymentSubmitted: () => void;
}

export default function CommissionPaymentForm({ orderId, commissionAmount, status, rejectReason, onPaymentSubmitted }: CommissionPaymentFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardcoded for now. It can be moved to env or backend settings
    const adminCardNumber = process.env.NEXT_PUBLIC_ADMIN_CARD_NUMBER || "1111 2222 3333 4444";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error('Будь ласка, оберіть файл квитанції.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/Orders/${orderId}/commission-receipt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Квитанцію відправлено. Очікуйте на підтвердження адміністратором.');
            onPaymentSubmitted();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || 'Помилка при відправці квитанції.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 1) { // Submitted
        return (
            <Card className="border-yellow-500 bg-yellow-50/10">
                <CardHeader>
                    <CardTitle className="text-lg">Оплата комісії на перевірці</CardTitle>
                    <CardDescription>
                        Ви відправили квитанцію. Будь ласка, зачекайте, поки адміністратор підтвердить оплату.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (status === 2) { // Approved
        return null; // Not shown if approved
    }

    return (
        <Card className={status === 3 ? "border-red-500" : ""}>
            <CardHeader>
                <CardTitle className="text-lg">Оплата комісії платформи</CardTitle>
                <CardDescription>
                    Щоб перевести замовлення в статус "В роботі", вам необхідно оплатити комісію платформи.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {status === 3 && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                        <strong>Вашу попередню квитанцію було відхилено:</strong> {rejectReason}
                        <br/>Будь ласка, завантажте правильну квитанцію.
                    </div>
                )}
                
                <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-medium mb-1">Сума до сплати:</p>
                    <p className="text-2xl font-bold">{commissionAmount.toFixed(2)} ₴</p>
                </div>
                
                <div className="space-y-2">
                    <Label>Номер картки для оплати</Label>
                    <div className="flex gap-2">
                        <Input value={adminCardNumber} readOnly className="font-mono text-lg" />
                        <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(adminCardNumber.replace(/\s/g, ''));
                            toast.success("Номер картки скопійовано");
                        }}>Копіювати</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="receipt">Квитанція або скріншот (Обов'язково)</Label>
                    <Input id="receipt" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} disabled={isSubmitting || !file} className="w-full">
                    {isSubmitting ? "Відправка..." : "Відправити квитанцію"}
                </Button>
            </CardFooter>
        </Card>
    );
}
