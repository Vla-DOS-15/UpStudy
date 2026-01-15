import { Metadata } from 'next';
import { CreateOrderForm } from '@/components/dashboard/create-order-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'Створити замовлення | UpStudy',
  description: 'Знайдіть виконавця для вашої роботи',
};

// Тимчасові дані (так як немає ендпоінтів для словників в OpenAPI)
// У реальному додатку це краще фетчити з бекенду або кешу
const MOCK_DISCIPLINES = [
  { id: 1, name: "Інформаційні технології" },
  { id: 2, name: "Економіка" },
  { id: 3, name: "Право" },
  { id: 4, name: "Математика" },
  { id: 5, name: "Іноземні мови" },
];

const MOCK_WORK_TYPES = [
  { id: 1, name: "Лабораторна робота" },
  { id: 2, name: "Курсова робота" },
  { id: 3, name: "Диплом" },
  { id: 4, name: "Есе" },
  { id: 5, name: "Реферат" },
];

export default function CreateOrderPage() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Нове замовлення</CardTitle>
          <CardDescription>
            Заповніть форму, щоб виконавці могли оцінити ваше завдання.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Передаємо дані в клієнтський компонент */}
          <CreateOrderForm 
            disciplines={MOCK_DISCIPLINES} 
            workTypes={MOCK_WORK_TYPES} 
          />
        </CardContent>
      </Card>
    </div>
  );
}