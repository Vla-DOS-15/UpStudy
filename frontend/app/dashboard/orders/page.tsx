import { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  PlusCircle, 
  CalendarDays, 
  Banknote, 
  FileText, 
  ArrowRight,
  Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Мої замовлення | UpStudy',
  description: 'Список створених вами завдань',
};

// Типи для статусу (відповідно до твого Enum на бекенді)
type OrderStatus = 'New' | 'InProgress' | 'Review' | 'Completed' | 'Cancelled' | 'Dispute';

// Інтерфейс замовлення (відповідає твоїй моделі)
interface Order {
  id: string;
  title: string;
  status: OrderStatus;
  price?: number;
  isNegotiable: boolean;
  deadline: string;
  discipline: string;
  workType: string;
  createdAt: string;
  proposalsCount: number; // Кількість ставок
}
