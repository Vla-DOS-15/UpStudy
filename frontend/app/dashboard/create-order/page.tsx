import { Metadata } from 'next';
import { CreateOrderForm } from '@/components/dashboard/create-order-form';
import { dictionaryService } from '@/services/dictionaryService'; // Імпортуємо наш новий сервіс
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

// Сторінка стає async Server Component
export default async function CreateOrderPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;

  // Виконуємо запити паралельно для швидкості
  const [disciplinesData, workTypesData] = await Promise.all([
    dictionaryService.getDisciplines(), // Обробка помилок, щоб сторінка не впала
    dictionaryService.getWorkTypes().catch(() => [])
  ]);

  const editId = typeof searchParams.edit === 'string' ? searchParams.edit : undefined;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{editId ? 'Редагування замовлення' : 'Нове замовлення'}</CardTitle>
          <CardDescription>
            {editId ? 'Внесіть зміни у ваше замовлення.' : 'Заповніть форму, щоб виконавці могли оцінити ваше завдання.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrderForm
            disciplines={disciplinesData}
            workTypes={workTypesData}
            editId={editId}
          />
        </CardContent>
      </Card>
    </div>
  );
}