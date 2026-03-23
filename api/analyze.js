// api/analyze.js - REMNANT FINAL DEBUG VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. 로그 기록: 서버가 작동 시작했음을 알림
  console.log("--- Analysis Started ---");
  console.log("Answers Received:", answers);

  if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is missing!");
    return res.status(500).json({ error: "환경변수 GEMINI_API_KEY를 찾을 수 없습니다." });
  }

  // 2. 가장 안정적인 구글 공식 주소 (v1beta 사용)
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `You are a world-class psychoanalyst. Analyze these 7 dream fragments and output ONLY a valid JSON. 
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
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    // 3. 구글에서 에러를 보낸 경우 로그에 상세히 기록
    if (data.error) {
      console.error("Google API Response Error:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // 4. 결과 추출 및 응답
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(resultText));
    console.log("--- Analysis Success ---");

  } catch (error) {
    console.error("Server-side Catch Error:", error.message);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
}
