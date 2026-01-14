import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Вхід | UpStudy",
  description: "Увійдіть у свій акаунт UpStudy",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Вхід в UpStudy</CardTitle>
          <CardDescription className="text-center">
            Введіть email та пароль для доступу до біржі
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}