export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  // Автоматично прибираємо випадкові пробіли з ключа
  const apiKey = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.trim() : null;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing in Vercel' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Витягни список задач з тексту. Поверни СТРОГО чистий JSON масив без форматування markdown чи слів.
Формат: [{"title": "Назва", "priority": "High/Medium/Low", "time": "12:00 або null"}]

Текст: ${text}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error ? data.error.message : 'Помилка Anthropic API' 
      });
    }

    const rawText = data.content[0].text.trim();
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const tasks = JSON.parse(cleanText);

    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
