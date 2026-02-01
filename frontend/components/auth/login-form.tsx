'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, googleLogin: loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success("Успіх!", { description: "З поверненням!" });
      if (onSuccess) onSuccess();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error("Помилка входу", { description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {/* ... інпути без змін ... */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="student@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Пароль</Label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Забули пароль?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Увійти
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Або увійти через</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse: CredentialResponse) => {
            if (credentialResponse.credential) {
              try {
                // @ts-ignore - googleLogin added to context
                await loginWithGoogle(credentialResponse.credential);
              } catch (e) {
                // Error handled in context
              }
            }
          }}
          onError={() => {
            toast.error('Login Failed');
          }}
          useOneTap
        />
      </div>
    </form>
  );
}