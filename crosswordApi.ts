
import { CrosswordData, Category } from "./types";

const API_BASE_URL = 'https://cross-questpython-production.up.railway.app/api';

/**
 * Получает список категорий с сервера.
 * Включает логику повторных попыток с экспоненциальной задержкой.
 */
export async function fetchCategories(retries = 3): Promise<Category[]> {
  for (let i = 0; i <= retries; i++) {
    try {
      // Railway.app может "засыпать". Даем больше времени на холодный старт (30 сек).
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data || !data.categories) {
        throw new Error('Invalid response format: missing categories');
      }
      
      return data.categories;
    } catch (error: any) {
      const isLastRetry = i === retries;
      const errorMessage = error.name === 'AbortError' ? 'Timeout' : error.message;
      
      console.warn(`Attempt ${i + 1} to fetch categories failed: ${errorMessage}`);
      
      if (isLastRetry) {
        console.error("Critical API Error: Could not connect to the crossword backend after multiple attempts.");
        throw new Error('SERVER_UNREACHABLE');
      }
      
      // Задержка перед следующей попыткой: 2с, 4с, 6с...
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  throw new Error('FAILED_TO_FETCH_CATEGORIES');
}

/**
 * Генерирует кроссворд для выбранной категории и сложности.
 */
export async function generateCrossword(
  category: string, 
  difficulty: string, 
  excludedIds: string[],
  retries = 2
): Promise<CrosswordData> {
  const payload = {
    category,
    difficulty,
    excluded_ids: excludedIds
  };

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Генерация может быть долгой

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) throw new Error('CATEGORY_NOT_FOUND');
        if (response.status === 429) throw new Error('TOO_MANY_REQUESTS');
        throw new Error(`HTTP ${response.status}: Generation failed`);
      }

      const data = await response.json();
      if (!data || !data.grid || !data.words) {
        throw new Error('Invalid crossword data received');
      }
      return data as CrosswordData;
    } catch (error: any) {
      const isLastRetry = i === retries;
      const isSpecificError = ['CATEGORY_NOT_FOUND', 'TOO_MANY_REQUESTS'].includes(error.message);
      
      console.warn(`Attempt ${i + 1} to generate crossword failed: ${error.message}`);
      
      if (isLastRetry || isSpecificError) throw error;
      
      // Задержка перед повтором
      await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
    }
  }
  throw new Error('GENERATION_TIMEOUT');
}
