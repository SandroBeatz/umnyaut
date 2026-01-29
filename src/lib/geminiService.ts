import { GoogleGenAI, Type } from "@google/genai";
import { CrosswordData, Direction } from "@/types";

// Initialize GoogleGenAI lazily to avoid SSR issues
let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const CROSSWORD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    gridSize: { type: Type.NUMBER },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          clue: { type: Type.STRING },
          answer: { type: Type.STRING },
          row: { type: Type.NUMBER },
          col: { type: Type.NUMBER },
          direction: { type: Type.STRING }
        },
        required: ["id", "clue", "answer", "row", "col", "direction"]
      }
    }
  },
  required: ["title", "gridSize", "items"]
};

export async function generateCrossword(categories: string[]): Promise<CrosswordData> {
  const theme = categories.join(', ');
  
  // Ультра-лаконичный промпт для мгновенной генерации
  const prompt = `Сгенерируй кроссворд (3-4 слова) на тему: ${theme}. 
Требования:
1. Только существительные в ед.ч.
2. Слова ОБЯЗАТЕЛЬНО пересекаются.
3. Координаты 0-9.
4. JSON: title, gridSize, items. Direction: 'H' или 'V'.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: CROSSWORD_SCHEMA,
      temperature: 0, // Минимум для скорости
    },
  });

  try {
    const text = response.text?.trim() || "";
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    const data = JSON.parse(text);
    data.items = data.items.map((item: any) => ({
      ...item,
      answer: item.answer.toUpperCase().replace(/[^А-ЯЁA-Z]/g, ''),
      direction: item.direction === 'H' ? Direction.HORIZONTAL : Direction.VERTICAL
    }));
    return data as CrosswordData;
  } catch (e) {
    console.error("Quick generate failed", e);
    throw new Error("Ошибка быстрого синтеза. Попробуйте снова.");
  }
}
