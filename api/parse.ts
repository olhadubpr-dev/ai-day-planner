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
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Будь ласка, вкажіть текст для парсингу." });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(now.getDate() + 2);
    const afterTomorrowStr = afterTomorrow.toISOString().split("T")[0];

    const getUpcomingDateForDay = (targetDayIdx: number) => {
      const currentIdx = now.getDay();
      let diff = targetDayIdx - currentIdx;
      if (diff < 0) diff += 7;
      const d = new Date(now);
      d.setDate(now.getDate() + diff);
      return d.toISOString().split("T")[0];
    };

    const daysOfWeekUk = ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];
    const currentDayName = daysOfWeekUk[now.getDay()];

    const fridayStr = getUpcomingDateForDay(5);

    const daysCalendarPrompt = [
      `Понеділок / у понеділок: ${getUpcomingDateForDay(1)}`,
      `Вівторок / у вівторок: ${getUpcomingDateForDay(2)}`,
      `Середа / у середу: ${getUpcomingDateForDay(3)}`,
      `Четвер / у четвер: ${getUpcomingDateForDay(4)}`,
      `П'ятниця / у п'ятницю / кінець робочого тижня: ${getUpcomingDateForDay(5)}`,
      `Субота / у суботу: ${getUpcomingDateForDay(6)}`,
      `Неділя / у неділю: ${getUpcomingDateForDay(0)}`,
    ].join("\n");

    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

    // 1. If Anthropic Claude API key is provided, use Anthropic Claude
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
                content: `Витягни список задач з тексту українською мовою. 
Сьогоднішній день: ${todayStr} (${currentDayName}).
Завтрашній день: ${tomorrowStr}.
Післязавтра: ${afterTomorrowStr}.

ТОЧНИЙ КАЛЕНДАР ДНІВ ТИЖНЯ ДЛЯ РОЗРАХУНКУ DATES ("YYYY-MM-DD"):
${daysCalendarPrompt}

ПРАВИЛА ВИЗНАЧЕННЯ DEADLINE ("YYYY-MM-DD" або null):
- Якщо вказано "сьогодні" -> "${todayStr}"
- Якщо вказано "завтра" -> "${tomorrowStr}"
- Якщо вказано "післязавтра" -> "${afterTomorrowStr}"
- Якщо вказано "до кінця робочого тижня" або "у п'ятницю" -> "${fridayStr}"
- Якщо вказано конкретний день тижня (наприклад, "у суботу", "в четвер", "у п'ятницю") -> використай дату відповідного дня з календаря вище.
- Якщо вказано конкретну дату ("25 липня") -> обчисли відповідну дату YYYY-MM-DD.
- Якщо НЕМАЄ ЖОДНОЇ ДАТИ чи дня тижня у запиті -> обов'язково deadline: null.

ПРАВИЛА ВИЗНАЧЕННЯ ЧАСУ ("HH:MM" або null):
- Якщо вказано конкретний час ("до 19:00", "о 10:00", "о 10 ранку" -> "10:00", "о 18:00") -> перетвори в точний "HH:MM" (наприклад, "19:00").
- Якщо немає точного часу -> time: null.

Поверни СТРОГО чистий JSON масив об'єктів без будь-якого форматування markdown чи додаткового тексту.
Формат масиву: [{"title": "Назва дії", "priority": "High/Medium/Low", "time": "HH:MM або null", "durationMinutes": 30, "category": "Робота/Дім/Особисте", "energyLevel": "High/Medium/Low", "deadline": "YYYY-MM-DD або null", "subtasks": ["підзадача 1"]}]

Текст користувача: ${text}`,
              },
            ],
          }),
        });

        const data: any = await response.json();
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
            deadline: t.deadline || null,
            subtasks: (t.subtasks || []).map((subTitle: any, sIdx: number) => ({
              id: `sub-${Date.now()}-${idx}-${sIdx}`,
              title: typeof subTitle === "string" ? subTitle : subTitle.title,
              completed: false,
            })),
            completed: false,
            createdAt: new Date().toISOString(),
          }));

          return res.status(200).json({ tasks: tasksWithMetadata });
        }
      } catch (anthropicErr) {
        console.error("Error using Anthropic API:", anthropicErr);
      }
    }

    // 2. Gemini API
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback rule-based
      const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const fallbackTasks = lines.map((line: string, idx: number) => {
        const lower = line.toLowerCase();
        let dl: string | null = null;
        if (lower.includes("сьогодні")) dl = todayStr;
        else if (lower.includes("завтра")) dl = tomorrowStr;
        else if (lower.includes("п'ятниц") || lower.includes("кінець робочого тижня")) dl = fridayStr;

        return {
          id: `task-${Date.now()}-${idx}`,
          title: line.replace(/^[-\*\d\.\s]+/, ""),
          priority: lower.includes("терміново") || lower.includes("важливо") ? "High" : "Medium",
          time: null,
          durationMinutes: 30,
          category: "Загальні",
          energyLevel: "Medium",
          deadline: dl,
          subtasks: [],
          completed: false,
          tags: ["введення"],
        };
      });
      return res.status(200).json({ tasks: fallbackTasks });
    }

    const prompt = `Ви — інтелектуальний асистент-планер завдань (у стилі Todoist).
Витягни всі детальні задачі з наданого тексту/голосової розшифровки українською мовою.

Сьогоднішній день: ${todayStr} (${currentDayName}).
Завтрашній день: ${tomorrowStr}.
Післязавтра: ${afterTomorrowStr}.

ТОЧНИЙ КАЛЕНДАР ДНІВ ТИЖНЯ ДЛЯ РОЗРАХУНКУ DATES ("YYYY-MM-DD"):
${daysCalendarPrompt}

Текст користувача:
"${text}"

ПРАВИЛА ВИЗНАЧЕННЯ DEADLINE ("YYYY-MM-DD" або null):
- Якщо вказано "сьогодні" -> "${todayStr}"
- Якщо вказано "завтра" -> "${tomorrowStr}"
- Якщо вказано "післязавтра" -> "${afterTomorrowStr}"
- Якщо вказано "до кінця робочого тижня" або "у п'ятницю" -> "${fridayStr}"
- Якщо вказано конкретний день тижня (наприклад, "у суботу", "у вівторок", "у п'ятницю") -> використай точну дату з календаря вище.
- Якщо вказано дату ("25 липня") -> обчисли відповідну дату "YYYY-MM-DD".
- Якщо НЕМАЄ ЖОДНОЇ ДАТИ чи дня тижня у запиті -> обов'язково deadline: null.

ПРАВИЛА ВИЗНАЧЕННЯ ЧАСУ ("HH:MM" або null):
- Якщо вказано конкретний час ("до 19:00", "о 10:00", "о 10 ранку" -> "10:00", "о 18:00") -> сформуй у точний формат "HH:MM" (наприклад, "19:00").
- Якщо немає конкретного часу -> time: null.

Проаналізуй контекст, розбий складні думки на конкретні кроки, визнач:
- title: Чітка назва дії (дієслово в початковій формі або конкретна задача українською).
- priority: "High" (високий/терміново), "Medium" (звичайний), "Low" (низький/за наявності часу).
- time: Точний час у форматі "HH:MM" (наприклад "10:00", "19:00") або null, якщо конкретну годину не вказано.
- durationMinutes: Орієнтовна тривалість у хвилинах (число: 15, 30, 45, 60, 120 тощо).
- category: Сфера життя ("Робота", "Особисте", "Здоров'я", "Навчання", "Дім", "Фінанси").
- energyLevel: Необхідний рівень фокусу/енергії ("High" - важкі інтелектуальні, "Medium" - стандартні, "Low" - рутина/легкі).
- deadline: Дата у форматі "YYYY-MM-DD" або null за правилами вище.
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

    const tasksWithMetadata = parsedJson.map((t: any, idx: number) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      ...t,
      subtasks: (t.subtasks || []).map((subTitle: string, sIdx: number) => ({
        id: `sub-${Date.now()}-${idx}-${sIdx}`,
        title: subTitle,
        completed: false,
      })),
      completed: false,
      createdAt: new Date().toISOString(),
    }));

    return res.status(200).json({ tasks: tasksWithMetadata });
  } catch (error: any) {
    console.error("Parse API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
