export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing in Vercel settings.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Проаналізуй наступний текст і виокреми з нього список конкретних задач.
          Поверни СТРОГО чистий JSON масив об'єктів. Жодного іншого тексту, привітань чи markdown-блоків (без \`\`\`json).
          
          Формат кожного елемента:
          {"title": "Коротка назва задачі", "priority": "High/Medium/Low", "time": "Час/дедлайн або null"}

          Текст: "${text}"`
        }]
      })
    });

    const data = await response.json();

    // Якщо Anthropic повернув помилку (наприклад, немає грошей на балансі чи невалідний ключ)
    if (data.error) {
      return res.status(400).json({ error: `Anthropic API Error: ${data.error.message}` });
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return res.status(500).json({ error: 'Порожня відповідь від AI' });
    }

    const rawContent = data.content[0].text.trim();
    
    // Очищення відповіді від можливих markdown-тегів
    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const tasks = JSON.parse(cleanJson);
    return res.status(200).json({ tasks });

  } catch (error) {
    return res.status(500).json({ 
      error: `Помилка обробки: ${error.message}` 
    });
  }
}
