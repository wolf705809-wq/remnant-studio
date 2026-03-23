// api/analyze.js - REMNANT FINAL MASTER CODE
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Vercel 환경변수에서 키를 찾을 수 없습니다." });

  // 🚀 가장 표준적인 'v1' 주소와 'gemini-1.5-flash' 명칭입니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `You are a world-class psychoanalyst. Analyze these dream fragments and output ONLY a valid JSON. 
        Data: ${answers.join(" | ")}
        Required JSON format: 
        {
          "keywords": "WORD1 • WORD2 • WORD3",
          "rarity": "0.7%",
          "report": {
            "title": "Dossier Title",
            "summary": "Deep analysis summary"
          }
        }`
      }]
    }],
    generationConfig: {
      response_mime_type: "application/json"
    }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    // 구글 API에서 에러를 보낸 경우 처리
    if (data.error) {
      console.error("Google AI API Error Detailed:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // 결과 추출
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(resultText));

  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: "서버 내부 오류: " + error.message });
  }
}
