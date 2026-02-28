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
        model: 'claude-sonnet-4-6',
        max_tokens: 3500,
        messages: [
          {
            role: 'user',
content: `あなたは栄養士です。以下の材料を使って作れる料理を3つ提案してください。

材料: ${ingredients.join('、')}

必ず以下の情報を全て含めてください：
1. 料理名（末尾に絵文字1つ）
2. 食材と分量（1人前）
3. 調味料と分量
4. 調理手順（5〜7ステップで詳しく）
5. 栄養情報（必須・概算値）

以下の正確なJSON形式で回答してください。他の文章は一切含めないでください：

{
  "recipes": [
    {
      "name": "鶏の照り焼き 🍗",
      "ingredients": ["鶏もも肉 150g", "玉ねぎ 1/4個"],
      "seasonings": ["醤油 大さじ1", "みりん 大さじ1"],
      "steps": ["鶏肉を一口大に切る", "フライパンで焼く", "調味料を加えて煮詰める", "玉ねぎを追加", "完成"],
      "nutrition": {
        "calories": 380,
        "salt": 1.8,
        "sugar": 12,
        "fat": 18
      }
    }
  ]
}

nutritionは必ず含めてください。calories, salt, sugar, fatの4つ全て必須です。`
            }
        ]
      })
    });

    const data = await response.json();
    
    // レスポンスをそのまま返す
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}