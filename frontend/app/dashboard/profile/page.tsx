'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { accountService } from '@/services/accountService';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Тут буде запит PUT /api/Account/profile
    toast.success('Профіль оновлено');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await accountService.uploadAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      toast.success('Аватарку успішно оновлено!');
    } catch (error: any) {
      toast.error('Не вдалося оновити аватарку');
    } finally {
      setIsUploading(false);
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
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className={`h-24 w-24 transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}>
                <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                <Camera className="w-8 h-8 text-white" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ім'я</Label>
                  <Input id="firstName" defaultValue={user.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input id="lastName" defaultValue={user.lastName} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled className="bg-muted" />
              </div>

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