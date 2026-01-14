'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Клієнтська валідація
    if (formData.password.length < 6) {
      toast.warning("Слабкий пароль", {
        description: "Пароль має містити мінімум 6 символів.",
      });
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      toast.success("Акаунт створено!", {
        description: "Ласкаво просимо до UpStudy.",
      });
      
      // Перенаправлення обробляється в AuthContext або тут через router.push
    } catch (error: any) {
      toast.error("Помилка реєстрації", {
        description: error.message || "Спробуйте пізніше.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Рядок Імені та Прізвища */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Ім'я</Label>
          <Input 
            id="firstName" 
            placeholder="Іван" 
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Прізвище</Label>
          <Input 
            id="lastName" 
            placeholder="Петренко" 
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="student@example.com" 
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input 
          id="password" 
          type="password" 
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Мінімум 6 символів
        </p>
      </div>
      
      <div className="flex flex-col space-y-4 pt-2">
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Зареєструватись
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Увійти
          </Link>
        </div>
      </div>
    </form>
  );
}