'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { accountService } from '@/services/accountService';
import { dictionaryService } from '@/services/dictionaryService';
import ProfileReviews from '@/components/profile/ProfileReviews';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegram, setTelegram] = useState('');
  const [userName, setUserName] = useState('');
  const [preferredDisciplineIds, setPreferredDisciplineIds] = useState<number[]>([]);
  
  const [directions, setDirections] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setTelegram(user.telegram || '');
      setUserName(user.userName || '');
      if (user.preferredDisciplineIds) {
        setPreferredDisciplineIds(user.preferredDisciplineIds);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchDirections = async () => {
      if (user?.roles?.includes('Executor')) {
        try {
          const res = await dictionaryService.getDirections();
          setDirections(res);
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchDirections();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await accountService.updateProfile({
        firstName,
        lastName,
        phoneNumber,
        telegram,
        userName,
        preferredDisciplineIds
      });
      updateUser({ firstName, lastName, phoneNumber, telegram, userName, preferredDisciplineIds });
      toast.success('Профіль оновлено');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Помилка при оновленні профілю';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
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

  const toggleDiscipline = (id: number) => {
    setPreferredDisciplineIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  if (!user) return null;

  const isExecutor = user.roles?.includes('Executor');

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
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className={`h-24 w-24 transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}>
                <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
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
              <p className="text-sm text-muted-foreground">@{user.userName}</p>
              <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-primary text-primary-foreground">
                {user.roles?.[0] || 'User'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
              <CardDescription>Оновіть свої особисті дані та налаштування роботи.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Юзернейм</Label>
                    <Input id="userName" value={userName} onChange={e => setUserName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user.email} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {isExecutor && (
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Номер телефону</Label>
                      <Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                    </div>
                  )}
                </div>

                {isExecutor && (
                  <div className="space-y-2">
                    <Label htmlFor="telegram">Telegram (опціонально)</Label>
                    <Input id="telegram" placeholder="@vlad_dev" value={telegram} onChange={e => setTelegram(e.target.value)} />
                  </div>
                )}

                {isExecutor && directions.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <Label className="text-base font-semibold">Бажані дисципліни</Label>
                    <p className="text-sm text-muted-foreground">
                      Оберіть предмети, з яких ви хочете отримувати замовлення.
                    </p>
                    <Accordion type="multiple" className="w-full border rounded-md px-4">
                      {directions.map((dir, idx) => {
                        const selectedCount = dir.disciplines.filter((d: any) => preferredDisciplineIds.includes(d.id)).length;
                        return (
                          <AccordionItem value={`item-${dir.id}`} key={dir.id} className={idx === directions.length - 1 ? "border-b-0" : ""}>
                            <AccordionTrigger className="hover:no-underline">
                              <span className="flex items-center gap-2">
                                {dir.name}
                                {selectedCount > 0 && (
                                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                    {selectedCount} обрано
                                  </span>
                                )}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pb-4">
                                {dir.disciplines.map((disc: any) => (
                                  <label
                                    key={disc.id}
                                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={preferredDisciplineIds.includes(disc.id)}
                                      onCheckedChange={() => toggleDiscipline(disc.id)}
                                      className="mt-1"
                                    />
                                    <span className="text-sm leading-none flex-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {disc.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Зберегти зміни
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Відгуки */}
          <ProfileReviews isExecutor={!!isExecutor} />
        </div>
      </div>
    </div>
  );
}