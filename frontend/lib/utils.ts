import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MAX_VISIBLE_PAGES } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getErrorMessage(error: any): string {
  // 1. Якщо це помилка валідації .NET (з полем errors)
  if (error.response?.data?.errors) {
    // Збираємо всі повідомлення з усіх полів в один рядок
    const validationErrors = Object.values(error.response.data.errors)
      .flat()
      .join(', ');
    return validationErrors;
  }

  // 2. Якщо це звичайна помилка з API (наприклад, { Message: "..." })
  if (error.response?.data?.Message) {
    return error.response.data.Message;
  }
  
  // 3. Якщо це помилка з AuthResponseDto (message з маленької)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // 4. Якщо це просто текст
  if (typeof error === 'string') {
    return error;
  }

  // 5. Стандартна помилка JS
  return error.message || "Сталася невідома помилка";
}

export function generatePagination(currentPage: number, totalPages: number) {
  // If total pages is MAX_VISIBLE_PAGES or less, show all pages
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const boundarySize = MAX_VISIBLE_PAGES - 1;

  // If current page is close to the start
  if (currentPage <= Math.ceil(boundarySize / 2) + 1) {
    return [...Array.from({ length: boundarySize }, (_, i) => i + 1), '...', totalPages];
  }

  // If current page is close to the end
  if (currentPage >= totalPages - Math.ceil(boundarySize / 2)) {
    return [1, '...', ...Array.from({ length: boundarySize }, (_, i) => totalPages - boundarySize + 1 + i)];
  }

  // If current page is somewhere in the middle
  const siblings = Math.max(1, Math.floor((MAX_VISIBLE_PAGES - 3) / 2));
  const middlePages = Array.from(
    { length: siblings * 2 + 1 },
    (_, i) => currentPage - siblings + i
  );

  return [1, '...', ...middlePages, '...', totalPages];
}