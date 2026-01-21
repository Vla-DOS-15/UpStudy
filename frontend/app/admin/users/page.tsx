'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Search, MoreHorizontal, ShieldBan, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = users.filter(u => 
      u.fullName.toLowerCase().includes(lowerSearch) || 
      u.email.toLowerCase().includes(lowerSearch)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const loadData = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (e) {
      console.error(e);
      toast.error('Не вдалося завантажити список користувачів');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "розблокувати" : "заблокувати";
    
    // Можна додати кастомний діалог, але confirm теж працює
    if (!confirm(`Ви впевнені, що хочете ${action} цього користувача?`)) return;

    try {
      // Відправляємо протилежне значення (якщо був заблокований true, шлемо false)
      await adminService.toggleBlockUser(userId, !currentStatus);
      
      toast.success(`Користувача ${currentStatus ? "розблоковано" : "заблоковано"}`);
      
      // Оновлюємо локальний стейт без перезавантаження всієї таблиці (оптимізація)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isBlocked: !currentStatus } : u
      ));
    } catch (e) {
      console.error(e);
      toast.error("Помилка при зміні статусу");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Всі користувачі</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Пошук по імені або email" 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Користувач</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Користувачів не знайдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role || 'User'}</Badge>
                    </TableCell>
                    <TableCell>
                      {/* Пріоритет відображення статусів: 1. Блок, 2. Верифікація */}
                      {user.isBlocked ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <ShieldBan className="w-3 h-3" /> Заблокований
                        </Badge>
                      ) : user.isVerified ? (
                        <Badge className="bg-green-600 dark:bg-green-500/20 text-white dark:text-green-400 hover:bg-green-700">
                          Верифікований
                        </Badge>
                      ) : user.isVerificationPending ? (
                        <Badge className="bg-amber-500 dark:bg-amber-500/20 text-white dark:text-amber-400 hover:bg-amber-600">
                          Очікує
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Не верифікований</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Дії</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Копіювати ID
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Динамічний пункт меню блокування */}
                          <DropdownMenuItem 
                            onClick={() => handleBlockToggle(user.id, user.isBlocked)}
                            className={user.isBlocked 
                              ? "text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950 cursor-pointer" 
                              : "text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                            }
                          >
                            {user.isBlocked ? (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Розблокувати
                              </>
                            ) : (
                              <>
                                <ShieldBan className="mr-2 h-4 w-4" /> Заблокувати
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}