'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { Button } from '@/components/ui/button';

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const closeDialog = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button variant="ghost" onClick={() => setActiveTab("login")}>Увійти</Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button onClick={() => setActiveTab("register")}>Зареєструватись</Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {activeTab === 'login' ? 'Вхід в UpStudy' : 'Створення акаунту'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === 'login' 
              ? 'Введіть дані для доступу до кабінету' 
              : 'Оберіть роль та долучайтесь до платформи'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вхід</TabsTrigger>
            <TabsTrigger value="register">Реєстрація</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm onSuccess={closeDialog} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm onSuccess={closeDialog} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}