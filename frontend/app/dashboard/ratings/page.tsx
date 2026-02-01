"use client";

import { useEffect, useState } from "react";
import { userService, Author } from "@/services/userService";
import { AuthorCard } from "@/components/ratings/AuthorCard";
import { Loader2, Users } from "lucide-react";

export default function RatingsPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAuthors() {
            try {
                const data = await userService.getTopAuthors(20);
                setAuthors(data);
            } catch (error) {
                console.error("Failed to fetch authors", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAuthors();
    }, []);

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Рейтинг авторів</h1>
                    <p className="text-muted-foreground">Топ виконавців, яким довіряють студенти</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : authors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {authors.map((author) => (
                        <AuthorCard key={author.id} author={author} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-xl font-medium text-muted-foreground">Поки немає авторів з рейтингом</p>
                    <p className="text-sm text-muted-foreground mt-2">Станьте першим, виконавши замовлення!</p>
                </div>
            )}
        </div>
    );
}
