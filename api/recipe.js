export default async function handler(req, res) {
  // CORSヘッダーを設定（アプリからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;

    // Anthropic APIを呼び出し
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3500,
        messages: [
          {
            role: 'user',
            content: `You are a nutritionist. Create 3 Japanese recipes using these ingredients: ${ingredients.join(', ')}.

Return ONLY valid JSON (no markdown, no backticks, no extra text):

{
  "recipes": [
    {
      "name": "Recipe Name 🍳",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "seasonings": ["seasoning 1", "seasoning 2"],
      "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
      "nutrition": {
        "calories": 400,
        "salt": 2.5,
        "sugar": 15,
        "fat": 12
      }
    }
  ]
}

CRITICAL: nutrition object is REQUIRED for every recipe. Include all 4 values: calories, salt, sugar, fat.`
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Anthropic API response:', JSON.stringify(data, null, 2));

    // マークダウンのコードブロックを除去
    if (data.content && data.content.length > 0) {
      for (let i = 0; i < data.content.length; i++) {
        if (data.content[i].type === 'text') {
          let text = data.content[i].text;
          text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          data.content[i].text = text;
        }
      }
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
}