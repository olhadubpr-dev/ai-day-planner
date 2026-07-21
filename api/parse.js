export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on server.' });
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
          Поверни СТРОГО тільки валидний JSON масив без додаткового тексту чи форматування markdown. 
          Формат кожної задачі: {"title": "Назва задачі", "priority": "High/Medium/Low", "time": "Час або дедлайн, якщо вказано"}.
          
          Текст: "${text}"`
        }]
      })
    });

    const data = await response.json();
    const rawContent = data.content[0].text;
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const tasks = JSON.parse(cleanJson);

    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to parse tasks', details: error.message });
  }
}
