import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tasks, userPrompt } = req.body || {};
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

        const data: any = await response.json();
        if (response.ok && data.content && data.content[0]) {
          const rawText = data.content[0].text.trim();
          const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const reorderedTasks = JSON.parse(cleanText);
          return res.status(200).json({ reorderedTasks });
        }
      } catch (anthropicErr) {
        console.error("Error replanning with Anthropic:", anthropicErr);
      }
    }

    // 2. Gemini API
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({ reorderedTasks: tasks });
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
    return res.status(200).json({ reorderedTasks: updatedData });
  } catch (error: any) {
    console.error("Replan API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
