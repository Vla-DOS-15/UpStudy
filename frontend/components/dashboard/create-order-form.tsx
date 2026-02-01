'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronDownIcon, Loader2, UploadCloud, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';

import { orderService } from '@/services/orderService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
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

// Описуємо точний формат, який приходить з API (id: number)
interface DictionaryItem {
  id: number;
  name: string;
}

interface AttachmentDto {
  id: string;
  originalFileName: string;
  viewUrl?: string;
  downloadUrl?: string;
}

interface CreateOrderFormProps {
  disciplines: DictionaryItem[];
  workTypes: DictionaryItem[];
  editId?: string;
}

export function CreateOrderForm({ disciplines, workTypes, editId }: CreateOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // State for Edit Mode
  const [existingFiles, setExistingFiles] = useState<AttachmentDto[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      isNegotiable: false,
      disciplineId: '',
      workTypeId: '',
      price: undefined,
    },
  });

  const isNegotiable = form.watch('isNegotiable');

  // Fetch data if editId is present
  useEffect(() => {
    if (editId) {
      const fetchOrder = async () => {
        try {
          setIsLoading(true);
          const data = await orderService.getOrderById(editId);
          console.log("DEBUG: Fetched Order Data:", data);
          console.log("DEBUG: DisciplineId:", data.disciplineId, typeof data.disciplineId);
          console.log("DEBUG: WorkTypeId:", data.workTypeId, typeof data.workTypeId);

          // Map API data to Form values
          const formData = {
            title: data.title,
            description: data.description,
            isNegotiable: data.isNegotiable,
            disciplineId: data.disciplineId?.toString() || "", // Safely convert to string
            workTypeId: data.workTypeId?.toString() || "",     // Safely convert to string
            price: data.price,
            deadline: new Date(data.deadline),
          };
          console.log("DEBUG: Setting Form Data:", formData);

          if (data.attachments) {
            setExistingFiles(data.attachments);
          }

          form.reset(formData);
        } catch (err) {
          console.error(err);
          toast.error("Не вдалося завантажити дані замовлення");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [editId, form]);

  async function onSubmit(values: OrderFormValues) {
    if (!values.isNegotiable && (!values.price || values.price <= 0)) {
      form.setError('price', { message: 'Вкажіть бюджет або оберіть "Договірна"' });
      return;
    }

    try {
      setIsLoading(true);

      if (editId) {
        await orderService.update(editId, {
          ...values,
          disciplineId: Number(values.disciplineId),
          workTypeId: Number(values.workTypeId),
          files: files, // Send new files
          deletedFileIds: deletedFileIds // Send IDs of files to remove
        });
        toast.success('Замовлення оновлено!');
      } else {
        // Відправляємо як рядки. .NET сам перетворить "1" -> 1 (int)
        await orderService.create({
          ...values,
          disciplineId: values.disciplineId,
          workTypeId: values.workTypeId,
          files: files,
        });
        toast.success('Замовлення створено!');
      }

      router.push('/dashboard/orders');
      router.refresh();
    } catch (error: any) {
      console.error("Повна помилка:", error); // Дивіться в консоль браузера (F12)

      // Спроба дістати конкретне повідомлення про помилку з бекенду
      let errorMessage = 'Не вдалося створити замовлення.';

      if (error.response?.data?.errors) {
        // Якщо це ValidationProblemDetails (стандарт .NET)
        // Беремо першу помилку з об'єкта errors
        const firstErrorKey = Object.keys(error.response.data.errors)[0];
        errorMessage = error.response.data.errors[firstErrorKey][0];
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      }

      toast.error('Помилка', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Title */}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть предмет" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {disciplines && disciplines.length > 0 ? (
                      disciplines.map((d) => (
                        // 🔥 ВИПРАВЛЕННЯ: d.id.toString()
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-center text-muted-foreground">
                        Немає даних
                      </div>
                    )}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {workTypes && workTypes.length > 0 ? (
                      workTypes.map((t) => (
                        // 🔥 ВИПРАВЛЕННЯ: t.id.toString()
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-center text-muted-foreground">
                        Немає даних
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Решта форми (Дедлайн, Опис, Ціна) без змін... */}
        {/* ... (скопіюйте код нижче) ... */}

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дедлайн</FormLabel>
              <div className="flex gap-4">
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = field.value ? new Date(field.value) : new Date(date);
                            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                            if (!field.value) newDate.setHours(23, 59, 0);
                            field.onChange(newDate);
                          }
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-32">
                  <Input
                    type="time"
                    value={field.value ? format(field.value, "HH:mm") : ""}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const newDate = field.value ? new Date(field.value) : new Date();
                      newDate.setHours(h || 0);
                      newDate.setMinutes(m || 0);
                      field.onChange(newDate);
                    }}
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm mb-2 h-10 flex items-center bg-muted/20">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">Ціна договірна</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>Прикріпити файли</FormLabel>

          {/* Existing Files List (Edit Mode) */}
          {existingFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-muted-foreground">Вже завантажені файли:</p>
              <div className="grid gap-2">
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      <a
                        href={file.viewUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm truncate hover:underline"
                      >
                        {file.originalFileName}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => {
                        setDeletedFileIds(prev => [...prev, file.id]);
                        setExistingFiles(prev => prev.filter(f => f.id !== file.id));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Натисніть</span> щоб додати файли
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </label>
          </div>

          {/* New Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Нові файли:</p>
              <div className="grid gap-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => {
                        setFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormItem>

        <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editId ? 'Зберегти зміни' : 'Опублікувати замовлення'}
        </Button>
      </form>
    </Form>
  );
}