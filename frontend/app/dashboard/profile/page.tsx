'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { userService } from '@/services/userService';
import { Camera, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth(); // Assuming refreshUser exists or we just rely on page reload/local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Local state for avatar to show immediate update
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    userName: user?.userName || '',
    phoneNumber: user?.phoneNumber || '',
    bankCardNumber: user?.bankCardNumber || '',
    bankCardOwnerName: user?.bankCardOwnerName || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.updateProfile(formData);
      toast.success('Профіль оновлено');
      // await refreshUser(); // If implemented
    } catch (error: any) {
      console.error(error);
      toast.error("Помилка оновлення", { description: error.response?.data?.error || "Щось пішло не так" });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл занадто великий (макс 5МБ)");
      return;
    }

    try {
      setIsUploading(true);
      const { avatarUrl: newUrl } = await userService.uploadAvatar(file);
      setAvatarUrl(newUrl);
      toast.success("Аватар оновлено");
      // Optionally trigger user context refresh if AuthContext supports it
      // await refreshUser(); 
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося завантажити фото");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium">Мій профіль</h3>
        <p className="text-sm text-muted-foreground">
          Керуйте своїми персональними даними та налаштуваннями.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* Аватар та статус */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-32 w-32 border-4 border-muted/50 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={avatarUrl || user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {(user.userName || user.email || "U")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Overlay with camera icon */}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                {user.roles?.[0] || 'User'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center px-4">
              Натисніть на фото, щоб змінити аватар
            </p>
          </CardContent>
        </Card>

        {/* Форма редагування */}
        <Card>
          <CardHeader>
            <CardTitle>Основна інформація</CardTitle>
            <CardDescription>Змініть ваше ім'я або пароль тут.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Юзернейм</Label>
                <Input id="userName" value={formData.userName} onChange={handleChange} />
              </div>

              {(user.roles?.includes('Executor') || user.role === 'Executor') && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" value={formData.firstName} disabled className="bg-muted text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" value={formData.lastName} disabled className="bg-muted text-muted-foreground" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled className="bg-muted" />
              </div>

              {(user.roles?.includes('Executor') || user.role === 'Executor') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Номер телефону</Label>
                    <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+380..." />
                  </div>

                  <Separator className="my-2" />
                  <h4 className="text-sm font-medium">Платіжні дані</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankCardNumber">Номер карти (для отримання оплат)</Label>
                      <Input
                        id="bankCardNumber"
                        value={formData.bankCardNumber}
                        onChange={handleChange}
                        placeholder="XXXX XXXX XXXX XXXX"
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankCardOwnerName">ПІБ власника карти</Label>
                      <Input
                        id="bankCardOwnerName"
                        value={formData.bankCardOwnerName}
                        onChange={handleChange}
                        placeholder="UKR: ПЕТРЕНКО ПЕТРО ПЕТРОВИЧ"
                      />
                      <p className="text-[10px] text-muted-foreground">Вказуйте повністю, як у банку, щоб уникнути проблем з виплатами.</p>
                    </div>
                  </div>
                </>
              )}

              {/* Для виконавців можна додати поле "Про мене" */}

              <div className="flex justify-end pt-4">
                <Button type="submit">Зберегти зміни</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}