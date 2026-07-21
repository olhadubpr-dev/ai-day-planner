export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Не знайдено API-ключ у Vercel' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Проаналізуй текст і виокреми з нього список конкретних задач. 
Поверни СТРОГО тільки валидний JSON масив без додаткового тексту чи форматування markdown. 

Формат: [{"title": "Назва", "priority": "High/Medium/Low", "time": "Час або null"}]

Текст: "${text}"`
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const rawText = data.content[0].text.trim();
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const tasks = JSON.parse(cleanText);

    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
