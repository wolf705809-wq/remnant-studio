// api/analyze.js - REMNANT FINAL STABLE VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 [해결 포인트] 주소를 v1beta에서 v1으로 변경하여 안정성 확보
  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `You are a world-class psychoanalyst. Analyze these 7 dream fragments and return ONLY a valid JSON.
        Data: ${answers.join(" | ")}
        Format: {"keywords": "WORD1 • WORD2 • WORD3", "rarity": "0.7%", "report": {"title": "Title", "summary": "Summary"}}`
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
      console.error("Google API Final Error:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // AI 대답 추출 및 정제 (JSON만 골라내기)
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/); // JSON 형태만 추출하는 정규식
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("Invalid AI Response Format");
    }

  } catch (error) {
    console.error("Critical Server Error:", error.message);
    res.status(500).json({ error: "분석 서버 오류가 발생했습니다." });
  }
}
