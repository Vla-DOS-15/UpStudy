'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft, 
  ZoomIn, 
  Download,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils"; // Переконайтесь, що utils імпортовано

export default function VerificationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Стейт для модалок дій
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Стейт для перегляду файлів
  const [previewDoc, setPreviewDoc] = useState<{url: string, type: 'image' | 'pdf' | 'other', title: string} | null>(null);

  useEffect(() => {
    adminService.getVerificationDetails(id as string).then(setData);
  }, [id]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await adminService.approveUser(id as string);
      toast.success('Користувача верифіковано');
      setIsApproveOpen(false);
      router.push('/admin/verifications');
    } catch {
      toast.error('Помилка при підтвердженні');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Вкажіть причину відмови');
      return;
    }
    setIsProcessing(true);
    try {
      await adminService.rejectUser(id as string, rejectReason);
      toast.success('Заявку відхилено');
      setIsRejectOpen(false);
      router.push('/admin/verifications');
    } catch {
      toast.error('Помилка при відхиленні');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!data) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* --- МОДАЛКА ПОПЕРЕДНЬОГО ПЕРЕГЛЯДУ ФАЙЛІВ --- */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent 
            className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden bg-black/95 border-none flex flex-col"
            // Важливо: прибираємо стандартний хрестик закриття, бо у нас свій хедер
        >
           {/* 🔥 ВИПРАВЛЕННЯ 1: Додаємо DialogTitle для accessibility, але ховаємо візуально (sr-only) */}
           <DialogHeader className="sr-only">
              <DialogTitle>Попередній перегляд: {previewDoc?.title}</DialogTitle>
           </DialogHeader>

           <div className="relative w-full h-full flex flex-col">
              {/* Хедер прев'ю */}
              <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent z-10 shrink-0">
                <h3 className="text-white font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> {previewDoc?.title}
                </h3>
                <div className="flex gap-2">
                   {previewDoc?.url && (
                     <Button variant="secondary" size="sm" asChild className="opacity-80 hover:opacity-100">
                       <a href={previewDoc.url} target="_blank" download rel="noreferrer">
                         <Download className="h-4 w-4 mr-2" /> Завантажити
                       </a>
                     </Button>
                   )}
                   <Button variant="destructive" size="icon" onClick={() => setPreviewDoc(null)}>
                     <X className="h-4 w-4" />
                   </Button>
                </div>
              </div>

              {/* Контент прев'ю */}
              <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-black/50">
                {previewDoc?.type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewDoc.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
                )}
                {previewDoc?.type === 'pdf' && (
                  <iframe src={previewDoc.url} className="w-full h-full bg-white rounded-md shadow-2xl" title="PDF Preview" />
                )}
                {previewDoc?.type === 'other' && (
                  <div className="text-white text-center">
                    <FileText className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Попередній перегляд недоступний</p>
                    <p className="text-sm text-gray-400 mb-6">Цей формат файлу не підтримується для перегляду в браузері.</p>
                    <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                      <a href={previewDoc.url} target="_blank" rel="noreferrer">Завантажити файл</a>
                    </Button>
                  </div>
                )}
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* --- ОСНОВНИЙ КОНТЕНТ --- */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/verifications">
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">{data.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-muted-foreground">{data.email}</span>
             <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border">
               {new Date(data.registeredAt).toLocaleDateString()}
             </span>
          </div>
        </div>
        
        <div className="flex gap-3">
           {/* Кнопка Відхилити */}
           <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="shadow-sm hover:bg-red-700 active:scale-95 transition-all duration-200"
              >
                <XCircle className="w-4 h-4 mr-2" /> Відхилити
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" /> Відхилення
                </DialogTitle>
                <DialogDescription>
                  Вкажіть причину, щоб користувач міг її виправити.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Textarea 
                  placeholder="Наприклад: Фото розмите..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="resize-none focus-visible:ring-red-500"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Скасувати</Button>
                <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Відхилити
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Кнопка Підтвердити */}
          <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
            <DialogTrigger asChild>
              {/* 🔥 ВИПРАВЛЕННЯ 2: Яскравіші кольори та ефекти hover */}
              <Button 
                className={cn(
                  "bg-green-600 text-white shadow-sm",
                  "hover:bg-green-700 hover:shadow-md",
                  "active:scale-95 active:bg-green-800",
                  "transition-all duration-200"
                )}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Підтвердити
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" /> Підтвердження
                </DialogTitle>
                <DialogDescription>
                  Надати користувачу права Виконавця?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>Скасувати</Button>
                 <Button 
                   className="bg-green-600 hover:bg-green-700 text-white"
                   onClick={handleApprove} 
                   disabled={isProcessing}
                 >
                   {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Так, підтвердити
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DocCard 
          title="Паспорт / ID-картка" 
          url={data.passportUrl} 
          onPreview={(type) => setPreviewDoc({ url: data.passportUrl, type, title: 'Паспорт' })}
        />
        <DocCard 
          title="Диплом / Освіта" 
          url={data.diplomaUrl} 
          onPreview={(type) => setPreviewDoc({ url: data.diplomaUrl, type, title: 'Диплом' })}
        />
      </div>
    </div>
  );
}

// 🔥 ВИПРАВЛЕННЯ 3: Надійна перевірка типу файлу (Regex)
function DocCard({ title, url, onPreview }: { title: string, url: string, onPreview: (type: 'image' | 'pdf' | 'other') => void }) {
  // Функція для визначення типу. Ігноруємо Query Params (все після ?)
  const getFileType = (fileUrl: string): 'image' | 'pdf' | 'other' => {
    if (!fileUrl) return 'other';
    // Видаляємо query params (наприклад ?token=...)
    const cleanUrl = fileUrl.split('?')[0].toLowerCase();
    
    if (cleanUrl.match(/\.(jpeg|jpg|png|webp|gif|bmp|tiff)$/)) return 'image';
    if (cleanUrl.match(/\.(pdf)$/)) return 'pdf';
    return 'other';
  };

  const type = getFileType(url);

  return (
    <Card className="overflow-hidden border h-full flex flex-col hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3 border-b">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> {title}
          </span>
          {url && (
             <span className={cn(
               "text-[10px] uppercase border px-1.5 py-0.5 rounded font-bold",
               type === 'image' ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" :
               type === 'pdf' ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :
               "bg-gray-100 text-gray-700"
             )}>
               {type === 'image' ? 'IMG' : type === 'pdf' ? 'PDF' : 'FILE'}
             </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative bg-slate-50 dark:bg-slate-900/50 min-h-[300px] flex items-center justify-center">
        {url ? (
          <>
            <div 
              className="w-full h-full flex items-center justify-center cursor-pointer relative z-10"
              onClick={() => onPreview(type)}
            >
              {type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                    src={url} 
                    alt={title} 
                    className="max-w-full max-h-[300px] object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]" 
                />
              ) : type === 'pdf' ? (
                <div className="text-center group-hover:text-red-600 transition-colors">
                  <FileText className="w-16 h-16 mx-auto mb-2 text-red-500/70 group-hover:text-red-600" />
                  <p className="text-sm font-medium">PDF Документ</p>
                  <p className="text-xs text-muted-foreground mt-1">Натисніть для перегляду</p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">Файл завантажено</p>
                  <Button variant="link" size="sm" className="mt-2 h-auto p-0">Завантажити</Button>
                </div>
              )}
            </div>

            {/* Оверлей при наведенні */}
            <div 
              className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"
            />
            
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            >
               <div className="bg-background/95 backdrop-blur-sm text-foreground px-4 py-2 rounded-full shadow-lg border flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                 <ZoomIn className="w-4 h-4" /> Переглянути
               </div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center opacity-50">
            <XCircle className="w-12 h-12 mb-3" />
            <span className="text-sm font-medium">Файл відсутній</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}