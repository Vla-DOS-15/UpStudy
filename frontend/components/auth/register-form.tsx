'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Briefcase } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess?: () => void;
  role: 'Client' | 'Executor';
  setRole: (role: 'Client' | 'Executor') => void;
}

export function RegisterForm({ onSuccess, role, setRole }: RegisterFormProps) {
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Помилка", { description: "Паролі не співпадають" });
      return;
    }

    try {
      const submitData = {
        role,
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
      };

      // Якщо тут буде помилка, AuthContext викине exception і ми підемо в catch
      await register(submitData);

      toast.success("Акаунт створено!");
      if (onSuccess) onSuccess();

      if (role === 'Executor') {
        router.push('/dashboard/setup-profile');
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      const message = getErrorMessage(error);
      toast.error("Помилка реєстрації", {
        description: message
      });
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* Перемикач ролей */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setRole('Client')}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'Client' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <User className="w-4 h-4" /> Замовник
        </button>
        <button
          type="button"
          onClick={() => setRole('Executor')}
          className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'Executor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Briefcase className="w-4 h-4" /> Виконавець
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Інпути ... */}
        <div className="space-y-2">
          <Label htmlFor="userName">Юзернейм</Label>
          <Input id="userName" placeholder="vlad_dev" value={formData.userName} onChange={handleChange} required />
        </div>



        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="mail@example.com" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Повторіть пароль</Label>
            <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
          </div>
        </div>

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {role === 'Executor' ? 'Стати виконавцем' : 'Зареєструватись'}
        </Button>
      </form>
    </div>
  );
}