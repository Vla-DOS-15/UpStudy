import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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