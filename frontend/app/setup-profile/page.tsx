'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    UploadCloud,
    Loader2,
    Plus,
    Trash2,
    LogOut,
    CheckIcon,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UniversityAutocomplete } from '@/components/ui/university-autocomplete';

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";

const STEPS = [
    { title: "Інформація" },
    { title: "Аватар" },
    { title: "Предмети" },
    { title: "Освіта" },
    { title: "Реквізити" },
    { title: "Документи" },
    { title: "Фініш" }
];

export default function SetupProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [directions, setDirections] = useState<{ id: number, name: string, disciplines: { id: number, name: string }[] }[]>([]);
    const [disciplineSearch, setDisciplineSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    useEffect(() => {
        api.get('/Dictionary/directions')
            .then(res => setDirections(res.data))
            .catch(() => toast.error('Помилка завантаження предметів'));
    }, []);

    const filteredDirections = directions.map(dir => ({
        ...dir,
        disciplines: dir.disciplines.filter(d => 
            d.name.toLowerCase().includes(disciplineSearch.toLowerCase())
        )
    })).filter(dir => dir.disciplines.length > 0);

    useEffect(() => {
        if (disciplineSearch) {
            setExpandedCategories(
                directions.map(dir => ({
                    ...dir,
                    disciplines: dir.disciplines.filter(d => 
                        d.name.toLowerCase().includes(disciplineSearch.toLowerCase())
                    )
                }))
                .filter(dir => dir.disciplines.length > 0)
                .map(d => `item-${d.id}`)
            );
        } else {
            setExpandedCategories([]);
        }
    }, [disciplineSearch, directions]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        userName: user?.userName || '',
        telegram: '',
        
        avatarFile: null as File | null,
        avatarPreview: '',
        
        preferredDisciplineIds: [] as number[],
        
        educations: [] as {
            universityName: string;
            isOtherUniversity: boolean;
            degree: string;
            startYear: string;
            isStudyingNow: boolean;
            endYear: string;
            documentFile: File | null;
        }[],
        
        certificates: [] as {
            name: string;
            startMonth: string;
            startYear: string;
            endMonth: string;
            endYear: string;
            url: string;
        }[],
        
        cardFullName: '',
        bankCardNumber: '',
        bankFullName: '',
        bankIpn: '',
        bankIban: '',
        
        passportFile: null as File | null
    });

    const uploadDocument = async (file: File, endpoint = '/Account/upload-document') => {
        const data = new FormData();
        data.append('file', file);
        const res = await api.post(endpoint, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.s3Key || res.data.avatarUrl; 
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.dateOfBirth || !formData.userName) {
                toast.error('Заповніть обов\'язкові поля');
                return;
            }
        }
        if (step === 3) {
            if (formData.preferredDisciplineIds.length === 0) {
                toast.error('Оберіть хоча б один предмет');
                return;
            }
        }
        if (step === 4) {
            if (formData.educations.length === 0 && formData.certificates.length === 0) {
                toast.error('Додайте хоча б одну освіту або сертифікат');
                return;
            }
            for (let edu of formData.educations) {
                if (!edu.universityName || !edu.degree || !edu.startYear || !edu.documentFile) {
                    toast.error('Заповніть всі поля для освіти та завантажте документ');
                    return;
                }
                if (!edu.isStudyingNow && !edu.endYear) {
                    toast.error('Вкажіть рік завершення або оберіть "Навчаюсь зараз"');
                    return;
                }
            }
        }
        if (step === 6) {
            if (!formData.passportFile) {
                toast.error('Завантажте фото паспорта');
                return;
            }
        }
        if (step < 7) setStep(step + 1);
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (formData.avatarFile) {
                await uploadDocument(formData.avatarFile, '/Files/avatar');
            }

            const educationsWithKeys = await Promise.all(formData.educations.map(async (edu) => {
                let docKey = null;
                if (edu.documentFile) {
                    docKey = await uploadDocument(edu.documentFile);
                }
                return {
                    universityName: edu.universityName,
                    isOtherUniversity: edu.isOtherUniversity,
                    degree: edu.degree,
                    startYear: parseInt(edu.startYear),
                    isStudyingNow: edu.isStudyingNow,
                    endYear: edu.isStudyingNow ? null : parseInt(edu.endYear),
                    documentS3Key: docKey
                };
            }));

            let passportKey = null;
            if (formData.passportFile) {
                passportKey = await uploadDocument(formData.passportFile);
            }

            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                telegram: formData.telegram,
                userName: formData.userName,
                dateOfBirth: formData.dateOfBirth,
                preferredDisciplineIds: formData.preferredDisciplineIds,
                educations: educationsWithKeys,
                certificates: formData.certificates.map(c => ({
                    name: c.name,
                    startMonth: parseInt(c.startMonth) || 1,
                    startYear: parseInt(c.startYear) || 2000,
                    endMonth: parseInt(c.endMonth) || 1,
                    endYear: parseInt(c.endYear) || 2000,
                    url: c.url
                })),
                cardFullName: formData.cardFullName,
                bankCardNumber: formData.bankCardNumber,
                bankFullName: formData.bankFullName,
                bankIpn: formData.bankIpn,
                bankIban: formData.bankIban,
                passportS3Key: passportKey
            };

            await api.post('/Account/setup-profile', payload);
            updateUser({ isVerificationPending: true, isVerified: false });
            setStep(7); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Помилка збереження');
        } finally {
            setIsLoading(false);
        }
    };

    const addEducation = () => {
        if (formData.educations.length >= 5) return toast.error('Максимум 5 ВНЗ');
        setFormData({
            ...formData,
            educations: [...formData.educations, {
                universityName: '', isOtherUniversity: false, degree: '', startYear: '', isStudyingNow: false, endYear: '', documentFile: null
            }]
        });
    };

    const addCertificate = () => {
        if (formData.certificates.length >= 5) return toast.error('Максимум 5 сертифікатів');
        setFormData({
            ...formData,
            certificates: [...formData.certificates, {
                name: '', startMonth: '', startYear: '', endMonth: '', endYear: '', url: ''
            }]
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-10 px-4 md:px-8">
            <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Налаштування профілю</h1>
                <Button variant="outline" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Вийти
                </Button>
            </div>

            <Stepper
                value={step}
                onValueChange={(val) => {
                    // Prevent jumping forward beyond completed steps
                    if (val < step || step === 7) setStep(val);
                }}
                className="w-full max-w-4xl space-y-8"
                indicators={{
                    completed: <CheckIcon className="size-3.5" />,
                    loading: <Loader2 className="size-3.5 animate-spin" />,
                }}
            >
                {/* Responsive StepperNav */}
                <StepperNav className="pointer-events-none">
                    {STEPS.map((s, index) => (
                        <StepperItem
                            key={index}
                            step={index + 1}
                            className="relative flex-1 items-start"
                        >
                            <StepperTrigger className="flex flex-col gap-2.5 items-center md:items-start">
                                <StepperIndicator>{index + 1}</StepperIndicator>
                                {/* Title only visible on md+ (Desktop) */}
                                <StepperTitle className="hidden md:block">{s.title}</StepperTitle>
                            </StepperTrigger>

                            {STEPS.length > index + 1 && (
                                <>
                                  {/* Mobile Separator (c-stepper-1 logic) */}
                                  <StepperSeparator className="md:hidden group-data-[state=completed]/step:bg-primary" />
                                  {/* Desktop Separator (c-stepper-5 logic) */}
                                  <StepperSeparator className="hidden md:block group-data-[state=completed]/step:bg-primary absolute inset-x-0 top-3 left-[calc(50%+0.875rem)] m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem+0.225rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none" />
                                </>
                            )}
                        </StepperItem>
                    ))}
                </StepperNav>

                <StepperPanel className="bg-card shadow-sm rounded-xl p-6 border w-full">
                    {/* Content is wrapped in StepperContent for active step rendering */}
                    <StepperContent value={1} className="space-y-4 animate-in fade-in w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ім'я</Label>
                                <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Прізвище</Label>
                                <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Телефон</Label>
                                <Input value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Дата народження</Label>
                                <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Електронна пошта</Label>
                                <Input value={user?.email || ''} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Юзернейм</Label>
                                <Input value={formData.userName} onChange={e => setFormData({ ...formData, userName: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Нік у Telegram (опціонально)</Label>
                                <Input placeholder="@telegram" value={formData.telegram} onChange={e => setFormData({ ...formData, telegram: e.target.value })} />
                            </div>
                        </div>
                    </StepperContent>

                    <StepperContent value={2} className="space-y-4 animate-in fade-in w-full">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
                            {formData.avatarPreview ? (
                                <img src={formData.avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover mb-4" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                                    <UploadCloud size={40} />
                                </div>
                            )}
                            <Label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                Обрати фото
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData({ 
                                            ...formData, 
                                            avatarFile: e.target.files[0],
                                            avatarPreview: URL.createObjectURL(e.target.files[0])
                                        });
                                    }
                                }} />
                            </Label>
                            <p className="text-xs text-muted-foreground mt-2 text-center">Якщо ви не оберете фото, буде встановлено дефолтне.</p>
                        </div>
                    </StepperContent>

                    <StepperContent value={3} className="space-y-4 animate-in fade-in w-full">
                        <p className="text-sm text-muted-foreground">Оберіть предмети, з яких ви готові виконувати замовлення.</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Пошук предметів..." 
                                className="pl-9"
                                value={disciplineSearch}
                                onChange={(e) => setDisciplineSearch(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2">
                            {filteredDirections.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Нічого не знайдено
                                </div>
                            ) : (
                            <Accordion 
                                type="multiple" 
                                value={expandedCategories}
                                onValueChange={setExpandedCategories}
                                className="w-full border rounded-md px-4"
                            >
                                {filteredDirections.map((dir, idx) => {
                                    const selectedCount = dir.disciplines.filter(d => formData.preferredDisciplineIds.includes(d.id)).length;
                                    return (
                                        <AccordionItem value={`item-${dir.id}`} key={dir.id} className={idx === directions.length - 1 ? "border-b-0" : ""}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <span className="flex items-center gap-2">
                                                    {dir.name}
                                                    {selectedCount > 0 && (
                                                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                                            {selectedCount} обрано
                                                        </span>
                                                    )}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pb-4">
                                                    {dir.disciplines.map(disc => (
                                                        <label
                                                            key={disc.id}
                                                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                                        >
                                                            <Checkbox 
                                                                checked={formData.preferredDisciplineIds.includes(disc.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setFormData({ ...formData, preferredDisciplineIds: [...formData.preferredDisciplineIds, disc.id] });
                                                                    } else {
                                                                        setFormData({ ...formData, preferredDisciplineIds: formData.preferredDisciplineIds.filter(id => id !== disc.id) });
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-sm leading-none flex-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                {disc.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                            )}
                        </div>
                    </StepperContent>

                    <StepperContent value={4} className="space-y-6 animate-in fade-in w-full">
                        <p className="text-sm text-muted-foreground">Додайте інформацію про вашу освіту (мінімум 1 запис освіти або сертифіката).</p>

                        <div className="space-y-4">
                            <h3 className="font-medium text-lg border-b pb-2">ВНЗ</h3>
                            {formData.educations.map((edu, idx) => (
                                <div key={idx} className="p-4 border rounded-lg bg-muted/30 space-y-3 relative">
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" 
                                        onClick={() => setFormData({ ...formData, educations: formData.educations.filter((_, i) => i !== idx) })}>
                                        <Trash2 size={16} />
                                    </Button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Назва ВНЗ</Label>
                                            {edu.isOtherUniversity ? (
                                                <Input value={edu.universityName} placeholder="Введіть назву ВНЗ" 
                                                    onChange={e => {
                                                        const newEds = [...formData.educations];
                                                        newEds[idx].universityName = e.target.value;
                                                        setFormData({ ...formData, educations: newEds });
                                                    }} />
                                            ) : (
                                                <UniversityAutocomplete 
                                                    value={edu.universityName} 
                                                    placeholder="Введіть назву або оберіть зі списку..." 
                                                    onChange={(val) => {
                                                        const newEds = [...formData.educations];
                                                        newEds[idx].universityName = val;
                                                        setFormData({ ...formData, educations: newEds });
                                                    }} 
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2 md:col-span-2">
                                            <Checkbox checked={edu.isOtherUniversity} onCheckedChange={(c: boolean) => {
                                                const newEds = [...formData.educations];
                                                newEds[idx].isOtherUniversity = c;
                                                setFormData({ ...formData, educations: newEds });
                                            }} />
                                            <Label>Ввести вручну (Інший ВНЗ)</Label>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Ступінь (Бакалавр, Магістр...)</Label>
                                            <Input value={edu.degree} onChange={e => {
                                                const newEds = [...formData.educations];
                                                newEds[idx].degree = e.target.value;
                                                setFormData({ ...formData, educations: newEds });
                                            }} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Рік вступу</Label>
                                            <Input type="number" placeholder="2020" value={edu.startYear} onChange={e => {
                                                const newEds = [...formData.educations];
                                                newEds[idx].startYear = e.target.value;
                                                setFormData({ ...formData, educations: newEds });
                                            }} />
                                        </div>

                                        <div className="flex items-center space-x-2 md:col-span-2 pt-2">
                                            <Checkbox checked={edu.isStudyingNow} onCheckedChange={(c: boolean) => {
                                                const newEds = [...formData.educations];
                                                newEds[idx].isStudyingNow = c;
                                                if (c) newEds[idx].endYear = '';
                                                setFormData({ ...formData, educations: newEds });
                                            }} />
                                            <Label>Навчаюсь зараз</Label>
                                        </div>

                                        {!edu.isStudyingNow && (
                                            <div className="space-y-2">
                                                <Label>Рік випуску</Label>
                                                <Input type="number" placeholder="2024" value={edu.endYear} onChange={e => {
                                                    const newEds = [...formData.educations];
                                                    newEds[idx].endYear = e.target.value;
                                                    setFormData({ ...formData, educations: newEds });
                                                }} />
                                            </div>
                                        )}

                                        <div className="space-y-2 md:col-span-2 pt-2">
                                            <Label>{edu.isStudyingNow ? 'Фото студентського квитка / довідки' : 'Фото диплома'}</Label>
                                            <Input type="file" accept="image/*,.pdf" onChange={e => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const newEds = [...formData.educations];
                                                    newEds[idx].documentFile = e.target.files[0];
                                                    setFormData({ ...formData, educations: newEds });
                                                }
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.educations.length < 5 && (
                                <Button variant="outline" className="w-full border-dashed" onClick={addEducation}>
                                    <Plus className="w-4 h-4 mr-2" /> Додати ВНЗ
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="font-medium text-lg border-b pb-2">Сертифікати</h3>
                            {formData.certificates.map((cert, idx) => (
                                <div key={idx} className="p-4 border rounded-lg bg-muted/30 space-y-3 relative">
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" 
                                        onClick={() => setFormData({ ...formData, certificates: formData.certificates.filter((_, i) => i !== idx) })}>
                                        <Trash2 size={16} />
                                    </Button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Назва сертифіката</Label>
                                            <Input value={cert.name} onChange={e => {
                                                const newCs = [...formData.certificates];
                                                newCs[idx].name = e.target.value;
                                                setFormData({ ...formData, certificates: newCs });
                                            }} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Початок (рік)</Label>
                                            <Input type="number" value={cert.startYear} onChange={e => {
                                                const newCs = [...formData.certificates];
                                                newCs[idx].startYear = e.target.value;
                                                setFormData({ ...formData, certificates: newCs });
                                            }} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Закінчення (рік)</Label>
                                            <Input type="number" value={cert.endYear} onChange={e => {
                                                const newCs = [...formData.certificates];
                                                newCs[idx].endYear = e.target.value;
                                                setFormData({ ...formData, certificates: newCs });
                                            }} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>URL посилання</Label>
                                            <Input type="url" value={cert.url} onChange={e => {
                                                const newCs = [...formData.certificates];
                                                newCs[idx].url = e.target.value;
                                                setFormData({ ...formData, certificates: newCs });
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.certificates.length < 5 && (
                                <Button variant="outline" className="w-full border-dashed" onClick={addCertificate}>
                                    <Plus className="w-4 h-4 mr-2" /> Додати Сертифікат
                                </Button>
                            )}
                        </div>
                    </StepperContent>

                    <StepperContent value={5} className="space-y-4 animate-in fade-in w-full">
                        <Tabs defaultValue="card" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="card">Карта</TabsTrigger>
                                <TabsTrigger value="bank">Банк (IBAN)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="card" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>ПІБ (як на карті)</Label>
                                    <Input value={formData.cardFullName} onChange={e => setFormData({ ...formData, cardFullName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Номер карти</Label>
                                    <Input maxLength={16} placeholder="0000 0000 0000 0000" value={formData.bankCardNumber} onChange={e => setFormData({ ...formData, bankCardNumber: e.target.value })} />
                                </div>
                            </TabsContent>
                            <TabsContent value="bank" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>ПІБ отримувача</Label>
                                    <Input value={formData.bankFullName} onChange={e => setFormData({ ...formData, bankFullName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>ІПН / ЄДРПОУ</Label>
                                    <Input value={formData.bankIpn} onChange={e => setFormData({ ...formData, bankIpn: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>IBAN</Label>
                                    <Input placeholder="UA..." value={formData.bankIban} onChange={e => setFormData({ ...formData, bankIban: e.target.value })} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </StepperContent>

                    <StepperContent value={6} className="space-y-4 animate-in fade-in w-full">
                        <p className="text-sm text-muted-foreground text-center">Завантажте фото паспорта або ID-картки для підтвердження вашої особи.</p>
                        
                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-4 text-center">
                            {formData.passportFile ? (
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    <CheckCircle2 className="text-green-500" />
                                    {formData.passportFile.name}
                                </div>
                            ) : (
                                <UploadCloud className="w-12 h-12 text-muted-foreground" />
                            )}
                            <Label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md">
                                Завантажити документ
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData({ ...formData, passportFile: e.target.files[0] });
                                    }
                                }} />
                            </Label>
                        </div>
                    </StepperContent>

                    <StepperContent value={7} className="text-center space-y-4 py-10 animate-in zoom-in w-full">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-2xl font-bold">Дані передано на обробку</h2>
                        <p className="text-muted-foreground">
                            Очікуйте на підтвердження вашого профілю адміністратором.<br/>
                            Ви отримаєте сповіщення на електронну пошту.
                        </p>
                        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                            Перейти на головну
                        </Button>
                    </StepperContent>

                    {step < 7 && (
                        <div className="flex justify-between mt-8 pt-4 border-t w-full">
                            <Button variant="outline" onClick={handlePrev} disabled={step === 1 || isLoading}>
                                <ChevronLeft className="w-4 h-4 mr-2" /> Назад
                            </Button>
                            
                            {step < 6 ? (
                                <Button onClick={handleNext}>
                                    Далі <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Завершити
                                </Button>
                            )}
                        </div>
                    )}
                </StepperPanel>
            </Stepper>
        </div>
    );
}
