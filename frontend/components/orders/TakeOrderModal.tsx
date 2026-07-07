'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    price: z.number().min(20, 'Мінімальна сума 20 ₴').max(200000, 'Максимальна сума 200 000 ₴'),
    comment: z.string().optional().refine(val => !val || (val.length >= 10 && val.length <= 1000), {
        message: 'Коментар має бути від 10 до 1000 символів'
    }),
});

interface TakeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (price: number, comment?: string) => Promise<void>;
    showCommentInput: boolean;
    initialPrice?: number;
}

export default function TakeOrderModal({
    isOpen,
    onClose,
    onSubmit,
    showCommentInput,
    initialPrice
}: TakeOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            price: initialPrice && initialPrice >= 20 ? initialPrice : 20,
            comment: '',
        },
    });

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsSubmitting(true);
            await onSubmit(values.price, values.comment);
            onClose();
        } catch (error) {
            // Error is handled and logged by parent component's onSubmit
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Взяти замовлення</DialogTitle>
                    <DialogDescription>
                        Вкажіть вашу ціну за виконання цього завдання.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Сума (₴)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            value={Number.isNaN(field.value) ? '' : field.value}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showCommentInput && (
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Повідомлення замовнику (опціонально)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Напишіть, чому варто обрати вас..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Підтвердити
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
