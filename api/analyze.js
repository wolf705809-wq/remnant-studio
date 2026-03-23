// api/analyze.js (구글 표준 v1beta 주소 적용 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 가장 안정적인 v1beta 주소와 gemini-1.5-flash 모델명입니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `You are a psychoanalyst. Analyze these 7 dream fragments and return ONLY a valid JSON.
        Data: ${answers.join(" | ")}
        JSON Structure: {"keywords": "WORD1 • WORD2 • WORD3", "rarity": "0.7%", "report": {"title": "Title", "summary": "Analysis Summary"}}`
      }]
    }]
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();

    // 구글 API에서 에러를 보냈을 경우 처리
    if (data.error) {
      console.error("Google API Error:", data.error.message);
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // AI의 대답 추출 및 정제
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
