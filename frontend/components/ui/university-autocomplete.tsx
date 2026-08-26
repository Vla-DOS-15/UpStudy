'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

interface UniversityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

interface University {
    id: number;
    name: string;
    nameEn: string | null;
}

export function UniversityAutocomplete({ value, onChange, disabled, placeholder }: UniversityAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<University[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!value || disabled) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/Dictionary/universities?query=${encodeURIComponent(value)}`);
                setSuggestions(res.data);
                setIsOpen(res.data.length > 0);
            } catch (error) {
                console.error("Failed to fetch universities", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [value, disabled]);

    const handleSelect = (universityName: string) => {
        onChange(universityName);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <Input 
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    if (e.target.value) setIsOpen(true);
                }}
                disabled={disabled}
                placeholder={placeholder || "Почніть вводити назву..."}
                autoComplete="off"
                onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                }}
            />
            {isOpen && !disabled && (
                <ul className="absolute z-50 w-full bg-popover text-popover-foreground border rounded-md shadow-md mt-1 max-h-60 overflow-auto">
                    {loading && suggestions.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Завантаження...</li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((u) => (
                            <li 
                                key={u.id}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                onClick={() => handleSelect(u.name)}
                            >
                                <div>{u.name}</div>
                                {u.nameEn && <div className="text-xs text-muted-foreground">{u.nameEn}</div>}
                            </li>
                        ))
                    ) : value && !loading ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Нічого не знайдено</li>
                    ) : null}
                </ul>
            )}
        </div>
    );
}
