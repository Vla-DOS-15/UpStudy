'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  
  // Стейт форми
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
    
    // Проста валідація на клієнті
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
      
      // Перенаправлення відбудеться всередині AuthContext (після авто-логіну)
      
    } catch (error: any) {
      toast.error("Помилка реєстрації", {
        description: error.message || "Спробуйте пізніше.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Реєстрація</CardTitle>
          <CardDescription className="text-center">
            Створіть акаунт, щоб почати працювати або замовляти
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            
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
              />
              <p className="text-xs text-muted-foreground">
                Мінімум 6 символів
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}