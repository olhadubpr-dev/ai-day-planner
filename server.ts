import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily or safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API: Parse raw text or voice transcript into structured tasks
app.post("/api/parse", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Будь ласка, вкажіть текст для парсингу." });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

    // 1. If Anthropic Claude API key is provided, use Anthropic Claude Haiku
    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `Витягни список задач з тексту українською мовою. Поверни СТРОГО чистий JSON масив об'єктів без будь-якого форматування markdown чи додаткового тексту.
Формат масиву: [{"title": "Назва", "priority": "High/Medium/Low", "time": "12:00 або null", "durationMinutes": 30, "category": "Робота/Дім/Особисте", "energyLevel": "High/Medium/Low", "subtasks": ["підзадача 1"]}]

Текст: ${text}`,
              },
            ],
          }),
        });

        const data = await response.json();
        if (response.ok && data.content && data.content[0]) {
          const rawText = data.content[0].text.trim();
          const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const tasks = JSON.parse(cleanText);

          const tasksWithMetadata = tasks.map((t: any, idx: number) => ({
            id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            title: t.title,
            priority: t.priority || "Medium",
            time: t.time || null,
            durationMinutes: t.durationMinutes || 30,
            category: t.category || "Загальні",
            energyLevel: t.energyLevel || "Medium",
            deadline: null,
            subtasks: (t.subtasks || []).map((subTitle: any, sIdx: number) => ({
              id: `sub-${Date.now()}-${idx}-${sIdx}`,
              title: typeof subTitle === "string" ? subTitle : subTitle.title,
              completed: false,
            })),
            completed: false,
            createdAt: new Date().toISOString(),
          }));

          return res.json({ tasks: tasksWithMetadata });
        }
      } catch (anthropicErr) {
        console.error("Error using Anthropic API:", anthropicErr);
      }
    }

    // 2. Otherwise use Gemini API
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback rule-based
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const fallbackTasks = lines.map((line, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        title: line.replace(/^[-\*\d\.\s]+/, ""),
        priority: line.toLowerCase().includes("терміново") || line.toLowerCase().includes("важливо") ? "High" : "Medium",
        time: null,
        durationMinutes: 30,
        category: "Загальні",
        energyLevel: "Medium",
        deadline: null,
        subtasks: [],
        completed: false,
        tags: ["введення"],
      }));
      return res.json({ tasks: fallbackTasks });
    }

    const prompt = `Ви — інтелектуальний асистент-планер завдань (у стилі Todoist).
Витягни всі детальні задачі з наданого тексту/голосової розшифровки українською мовою.

Текст користувача:
"${text}"

Проаналізуй контекст, розбий складні думки на конкретні кроки, визнач:
- title: Чітка назва дії (дієслово в початковій формі або конкретна задача українською).
- priority: "High" (високий/терміново), "Medium" (звичайний), "Low" (низький/за наявності часу).
- time: Точний час у форматі "HH:MM" (наприклад "10:00", "14:30") або null, якщо конкретну годину не вказано.
- durationMinutes: Орієнтовна тривалість у хвилинах (число: 15, 30, 45, 60, 120 тощо).
- category: Сфера життя ("Робота", "Особисте", "Здоров'я", "Навчання", "Дім", "Фінанси").
- energyLevel: Необхідний рівень фокусу/енергії ("High" - важкі інтелектуальні, "Medium" - стандартні, "Low" - рутина/легкі).
- deadline: Дата у форматі "YYYY-MM-DD" або null. (Сьогоднішнє число: ${new Date().toISOString().split("T")[0]}).
- subtasks: Масив з 1-3 підзадач (рядок), якщо задача масштабна, або порожній масив [].
- tags: Короткі теги українською (наприклад: ["зустріч", "дзвінок", "покупка"]).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              time: { type: Type.STRING, nullable: true },
              durationMinutes: { type: Type.NUMBER },
              category: { type: Type.STRING },
              energyLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              deadline: { type: Type.STRING, nullable: true },
              subtasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "priority", "durationMinutes", "category", "energyLevel"],
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "[]");
    
    // Attach unique IDs and completed flag
    const tasksWithMetadata = parsedJson.map((t: any, idx: number) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      ...t,
      subtasks: (t.subtasks || []).map((subTitle: string, sIdx: number) => ({
        id: `sub-${Date.now()}-${idx}-${sIdx}`,
        title: subTitle,
        completed: false
      })),
      completed: false,
      createdAt: new Date().toISOString()
    }));

    return res.json({ tasks: tasksWithMetadata });
  } catch (error: any) {
    console.error("Помилка парсингу Gemini:", error);
    return res.status(500).json({ 
      error: error?.message || "Не вдалося обробити текст за допомогою AI" 
    });
  }
});

// API: Smart Re-plan (Оптимізація та перепланування дня за енергією та обмеженнями)
app.post("/api/replan", async (req, res) => {
  try {
    const { tasks, userPrompt } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Немає задач для перепланування." });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

    // 1. If Anthropic Claude API key is provided
    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Ви — тайм-менеджер. Переплануй ці задачі за побажанням користувача:
Задачі: ${JSON.stringify(tasks)}
Побажання: "${userPrompt || "Впорядкуй за енергією та часом"}"

Поверни СТРОГО чистий JSON масив об'єктів без будь-якого форматування markdown чи тексту.
Формат масиву: [{"id": "id_задачі", "title": "Назва", "priority": "High/Medium/Low", "time": "10:00", "durationMinutes": 30, "category": "Категорія", "energyLevel": "High/Medium/Low", "adviceReason": "Чому вибрано такий час"}]`,
              },
            ],
          }),
        });

        const data = await response.json();
        if (response.ok && data.content && data.content[0]) {
          const rawText = data.content[0].text.trim();
          const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const reorderedTasks = JSON.parse(cleanText);
          return res.json({ reorderedTasks });
        }
      } catch (anthropicErr) {
        console.error("Error replanning with Anthropic:", anthropicErr);
      }
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ reorderedTasks: tasks });
    }

    const prompt = `Ви — висококласний продуктивний тайм-менеджер.
Ось список невиконаних задач користувача на сьогодні:
${JSON.stringify(tasks, null, 2)}

Побажання/обмеження користувача щодо дня:
"${userPrompt || "Впорядкуй задачі за правилом: складні та фокусні (High energy) на ранок, легкі та рутинні на другу половину дня, розстав реалістичний час."}"

Поверни оптимізований масив тих самих задач із збереженими ID, але оновленими полями 'time', 'priority' та відсортований у порядку виконання.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              time: { type: Type.STRING, nullable: true },
              durationMinutes: { type: Type.NUMBER },
              category: { type: Type.STRING },
              energyLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              adviceReason: { type: Type.STRING, description: "Коротке пояснення українською, чому час обрано саме так" }
            },
            required: ["id", "title", "priority", "category"],
          },
        },
      },
    });

    const updatedData = JSON.parse(response.text || "[]");
    return res.json({ reorderedTasks: updatedData });
  } catch (error: any) {
    console.error("Помилка перепланування:", error);
    return res.status(500).json({ error: error?.message || "Помилка при переплануванні" });
  }
});

// Serve frontend in dev / production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
