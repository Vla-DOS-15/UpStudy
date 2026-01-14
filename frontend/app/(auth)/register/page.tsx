import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Реєстрація | UpStudy",
  description: "Створіть акаунт для доступу до біржі студентських робіт",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      {/* Card та заголовки рендеряться на сервері */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Реєстрація</CardTitle>
          <CardDescription className="text-center">
            Створіть акаунт, щоб почати працювати або замовляти
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Інтерактивна форма підключається тут */}
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}