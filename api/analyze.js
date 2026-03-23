// api/analyze.js - REMNANT FINAL STABLE (v1)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 [핵심] v1beta가 아닌 v1 주소를 사용합니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `Analyze these 7 dream fragments and return ONLY a valid JSON.
        Data: ${answers.join(" | ")}
        Format: {"keywords": "WORD1 • WORD2 • WORD3", "rarity": "0.7%", "report": {"title": "Title", "summary": "Detailed analysis"}}`
      }]
    }]
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Google API Error:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // AI 대답에서 JSON만 안전하게 추출
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("Invalid AI Response");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
