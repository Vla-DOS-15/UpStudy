'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronDownIcon, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { orderService } from '@/services/orderService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// ВИПРАВЛЕНА СХЕМА
const formSchema = z.object({
  title: z.string().min(5, 'Заголовок має бути мінімум 5 символів').max(100),
  description: z.string().min(20, 'Опишіть завдання детальніше (мін. 20 символів)'),
  disciplineId: z.string().min(1, 'Оберіть дисципліну'),
  workTypeId: z.string().min(1, 'Оберіть тип роботи'),
  deadline: z.date(),
  isNegotiable: z.boolean(),
  price: z.number().optional(),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface CreateOrderFormProps {
  disciplines: { id: number; name: string }[];
  workTypes: { id: number; name: string }[];
}

export function CreateOrderForm({ disciplines, workTypes }: CreateOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ВИПРАВЛЕНО: Всі поля мають значення за замовчуванням
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      isNegotiable: false,
      disciplineId: '',
      workTypeId: '',
      price: undefined,
      deadline: undefined as any, // Тимчасово для TypeScript
    },
  });

  const isNegotiable = form.watch('isNegotiable');

  async function onSubmit(values: OrderFormValues) {
    // Валідація дедлайну
    if (!values.deadline) {
      form.setError('deadline', { message: 'Вкажіть дедлайн' });
      return;
    }

    // Валідація ціни
    if (!values.isNegotiable && (!values.price || values.price <= 0)) {
      form.setError('price', { message: 'Вкажіть бюджет або оберіть "Договірна"' });
      return;
    }

    try {
      setIsLoading(true);
      await orderService.create({
        ...values,
        files: files, 
      });

      toast.success('Замовлення створено!');
      router.push('/dashboard/orders');
      router.refresh();
    } catch (error: any) {
      toast.error('Помилка', {
        description: error.response?.data || 'Не вдалося створити замовлення.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тема завдання</FormLabel>
              <FormControl>
                <Input placeholder="Наприклад: Курсова робота..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discipline Select */}
          <FormField
            control={form.control}
            name="disciplineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дисципліна</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть предмет" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {disciplines.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* WorkType Select */}
          <FormField
            control={form.control}
            name="workTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип роботи</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Deadline DatePicker with Time */}
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дедлайн</FormLabel>
              <div className="flex gap-4">
                {/* Date Picker */}
                <div className="flex flex-col gap-3 flex-1">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP", { locale: uk }) : "Оберіть дату"}
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            // Зберігаємо час якщо він вже був встановлений
                            const newDate = field.value ? new Date(date) : new Date(date);
                            if (field.value) {
                              newDate.setHours(field.value.getHours());
                              newDate.setMinutes(field.value.getMinutes());
                              newDate.setSeconds(field.value.getSeconds());
                            }
                            field.onChange(newDate);
                          }
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Picker */}
                <div className="flex flex-col gap-3 w-32">
                  <Input
                    type="time"
                    step="60"
                    value={
                      field.value
                        ? `${String(field.value.getHours()).padStart(2, '0')}:${String(field.value.getMinutes()).padStart(2, '0')}`
                        : ''
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = field.value ? new Date(field.value) : new Date();
                      newDate.setHours(parseInt(hours, 10));
                      newDate.setMinutes(parseInt(minutes, 10));
                      newDate.setSeconds(0);
                      field.onChange(newDate);
                    }}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Textarea */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опис завдання</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Детально опишіть вимоги..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price & Negotiable */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Бюджет (грн)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1500" 
                    {...field} 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    disabled={isNegotiable} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isNegotiable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm mb-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ціна договірна</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* File Upload */}
        <FormItem>
          <FormLabel>Прикріпити файли</FormLabel>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Натисніть</span> щоб завантажити
                </p>
              </div>
              <input 
                id="dropzone-file" 
                type="file" 
                className="hidden" 
                multiple 
                onChange={(e) => setFiles(e.target.files)}
              />
            </label>
          </div>
          {files && files.length > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              Обрано файлів: {files.length}
            </div>
          )}
        </FormItem>

        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Опублікувати
        </Button>
      </form>
    </Form>
  );
}