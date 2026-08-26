'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Edit, Upload, DownloadCloud } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';

interface University {
    id: number;
    name: string;
    nameEn: string | null;
}

export default function AdminUniversitiesPage() {
    const [universities, setUniversities] = useState<University[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Sort & Select State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof University; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', nameEn: '' });

    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; desc: string; action: () => void }>({
        isOpen: false,
        title: '',
        desc: '',
        action: () => { }
    });

    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [csvConfig, setCsvConfig] = useState({
        colName: 'university_name',
        colNameEn: 'university_name_en',
        encoding: 'UTF-8'
    });

    const openConfirm = (title: string, desc: string, action: () => void) => {
        setConfirmDialog({ isOpen: true, title, desc, action });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/Admin/universities');
            setUniversities(res.data);
            setSelectedIds([]);
        } catch (error: any) {
            toast.error('Помилка завантаження університетів');
        } finally {
            setIsLoading(false);
        }
    };

    const sortedUniversities = [...universities].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aVal = a[key] ?? '';
        let bVal = b[key] ?? '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key: keyof University) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const totalPages = Math.max(1, Math.ceil(sortedUniversities.length / itemsPerPage));
    const paginatedUniversities = sortedUniversities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        openConfirm('Групове видалення', `Ви впевнені, що хочете видалити ${selectedIds.length} ВНЗ? Цю дію неможливо скасувати.`, async () => {
            setIsActionLoading(true);
            try {
                await api.post('/Admin/universities/bulk-delete', selectedIds);
                toast.success('Групове видалення успішне');
                setSelectedIds([]);
                fetchUniversities();
            } catch (error: any) {
                toast.error('Помилка групового видалення');
            } finally {
                setIsActionLoading(false);
            }
        });
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Назва (Укр) обов\'язкова');
            return;
        }

        setIsActionLoading(true);
        try {
            if (editingId) {
                await api.put(`/Admin/universities/${editingId}`, formData);
                toast.success('Оновлено успішно');
            } else {
                await api.post('/Admin/universities', formData);
                toast.success('Додано успішно');
            }
            setIsDialogOpen(false);
            fetchUniversities();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Помилка збереження');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        openConfirm('Видалення ВНЗ', 'Ви впевнені, що хочете видалити цей ВНЗ? Цю дію неможливо скасувати.', async () => {
            try {
                await api.delete(`/Admin/universities/${id}`);
                toast.success('Видалено успішно');
                fetchUniversities();
            } catch (error: any) {
                toast.error('Помилка видалення');
            }
        });
    };

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({ name: '', nameEn: '' });
        setIsDialogOpen(true);
    };

    const openEditDialog = (u: University) => {
        setEditingId(u.id);
        setFormData({ name: u.name, nameEn: u.nameEn || '' });
        setIsDialogOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
        setIsImportDialogOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processImport = async () => {
        if (!importFile) return;
        setIsActionLoading(true);

        try {
            if (importFile.name.endsWith('.json')) {
                const text = await importFile.text();
                const json = JSON.parse(text);
                if (!Array.isArray(json)) throw new Error('Файл має містити масив об\'єктів');
                await sendPopulateData(json);
            } else if (importFile.name.endsWith('.csv')) {
                Papa.parse(importFile, {
                    header: true,
                    skipEmptyLines: true,
                    encoding: csvConfig.encoding,
                    transformHeader: (h) => h.trim().replace(/^\uFEFF/, ''),
                    complete: async (results) => {
                        const data = results.data.map((row: any) => {
                            const n = row[csvConfig.colName?.trim()];
                            const ne = row[csvConfig.colNameEn?.trim()];
                            return {
                                name: n ? n.trim().substring(0, 500) : '',
                                nameEn: ne ? ne.trim().substring(0, 500) : null
                            };
                        }).filter((item: any) => item.name);

                        await sendPopulateData(data);
                    },
                    error: (error: any) => {
                        toast.error('Помилка парсингу CSV: ' + error.message);
                        setIsActionLoading(false);
                    }
                });
            } else {
                toast.error('Непідтримуваний формат файлу');
                setIsActionLoading(false);
            }
        } catch (error: any) {
            toast.error(error.message || 'Помилка обробки файлу');
            setIsActionLoading(false);
        }
    };

    const sendPopulateData = async (data: any[]) => {
        try {
            const res = await api.post('/Admin/universities/populate', data);
            toast.success(res.data?.message || 'Завантаження завершено');
            setIsImportDialogOpen(false);
            setImportFile(null);
            fetchUniversities();
        } catch (error: any) {
            console.error("Import error:", error.response?.data);
            const errMsgs = error.response?.data?.errors
                ? JSON.stringify(error.response.data.errors)
                : (error.response?.data?.title || 'Помилка імпорту');
            toast.error(`Помилка: ${errMsgs}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAutoPopulate = async () => {
        openConfirm(
            'Наповнення бази',
            'Це завантажить список ВНЗ України з відкритого API. Продовжити?',
            async () => {
                setIsActionLoading(true);
                try {
                    const res = await fetch('http://universities.hipolabs.com/search?country=Ukraine');
                    if (!res.ok) throw new Error('Помилка завантаження з API');

                    const data = await res.json();
                    const universitiesToSave = data.map((item: any) => ({
                        name: item.name,
                        nameEn: item.name
                    }));

                    const populateRes = await api.post('/Admin/universities/populate', universitiesToSave);
                    toast.success(populateRes.data.message || 'Завантаження завершено');
                    fetchUniversities();
                } catch (error: any) {
                    toast.error(error.message || 'Помилка автоматичного наповнення');
                } finally {
                    setIsActionLoading(false);
                }
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Університети</h1>
                    <p className="text-sm text-muted-foreground">Керування довідником вищих навчальних закладів.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={isActionLoading}>
                            <Trash2 className="w-4 h-4 mr-2" /> Видалити ({selectedIds.length})
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleAutoPopulate} disabled={isActionLoading}>
                        <DownloadCloud className="w-4 h-4 mr-2" /> З API
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isActionLoading}>
                        <Upload className="w-4 h-4 mr-2" /> Імпорт (CSV/JSON)
                    </Button>
                    <input
                        type="file"
                        accept=".json,.csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    <Button onClick={openCreateDialog}>
                        <Plus className="w-4 h-4 mr-2" /> Додати ВНЗ
                    </Button>
                </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === universities.length && universities.length > 0}
                                    onCheckedChange={(c) => setSelectedIds(c ? universities.map(u => u.id) : [])}
                                />
                            </TableHead>
                            <TableHead className="w-[80px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('id')}>
                                ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('name')}>
                                Назва (Укр) {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('nameEn')}>
                                Назва (Англ) {sortConfig?.key === 'nameEn' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className="text-right">Дії</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : universities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Немає даних. Додайте університет або завантажте список.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUniversities.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(u.id)}
                                            onCheckedChange={(c) => {
                                                if (c) setSelectedIds([...selectedIds, u.id]);
                                                else setSelectedIds(selectedIds.filter(id => id !== u.id));
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{u.id}</TableCell>
                                    <TableCell className="font-medium max-w-[300px] whitespace-normal break-words">{u.name}</TableCell>
                                    <TableCell className="max-w-[300px] whitespace-normal break-words">{u.nameEn || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Записів на сторінці:</span>
                    <select
                        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={1000}>1000</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Попередня
                    </Button>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Сторінка {currentPage} з {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Наступна
                    </Button>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Редагувати ВНЗ' : 'Новий ВНЗ'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Назва (Українською) *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Наприклад: Київський національний університет імені Тараса Шевченка"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Назва (Англійською)</Label>
                            <Input
                                value={formData.nameEn}
                                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                                placeholder="Наприклад: Taras Shevchenko National University of Kyiv"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Скасувати</Button>
                        <Button onClick={handleSave} disabled={isActionLoading}>
                            {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Зберегти
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">{confirmDialog.desc}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Скасувати</Button>
                        <Button onClick={() => {
                            confirmDialog.action();
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }}>Продовжити</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Діалог Імпорту CSV/JSON */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Налаштування імпорту ({importFile?.name})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            {importFile?.name.endsWith('.csv')
                                ? 'Вкажіть точні назви колонок у вашому CSV файлі, які відповідають за назву ВНЗ.'
                                : 'Файл у форматі JSON буде завантажено як є. Очікується масив об\'єктів із полями name та nameEn.'}
                        </p>

                        {importFile?.name.endsWith('.csv') && (
                            <>
                                <div className="space-y-2">
                                    <Label>Колонка для назви (Укр) *</Label>
                                    <Input
                                        value={csvConfig.colName}
                                        onChange={e => setCsvConfig({ ...csvConfig, colName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Колонка для назви (Англ) (Опціонально)</Label>
                                    <Input
                                        value={csvConfig.colNameEn}
                                        onChange={e => setCsvConfig({ ...csvConfig, colNameEn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Кодування файлу</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={csvConfig.encoding}
                                        onChange={e => setCsvConfig({ ...csvConfig, encoding: e.target.value })}
                                    >
                                        <option value="UTF-8">UTF-8 (Стандартне)</option>
                                        <option value="windows-1251">Windows-1251 (Excel Кирилиця)</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                            setIsImportDialogOpen(false);
                            setImportFile(null);
                        }}>Скасувати</Button>
                        <Button onClick={processImport} disabled={isActionLoading}>
                            {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Почати імпорт
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
