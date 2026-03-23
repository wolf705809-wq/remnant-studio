// api/analyze.js - REMNANT FINAL SUCCESS VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 v1beta 주소와 gemini-1.5-flash 모델 사용
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 정신분석학자입니다. 다음 꿈 답변을 분석하여 오직 JSON 형식으로만 응답하세요.
        데이터: ${answers.join(" | ")}
        출력 형식:
        {
          "keywords": "WORD1 • WORD2 • WORD3",
          "rarity": "0.8%",
          "report": {
            "title": "분석 제목",
            "summary": "내용 요약"
          }
        }`
      }]
    }],
    generationConfig: {
      // 🚀 여기가 핵심입니다! responseMimeType (카멜케이스)으로 수정 완료
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Google AI API Error:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // AI 대답 추출 (JSON 외의 불필요한 마크다운 제거)
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: "서버 내부 오류: " + error.message });
  }
}
