// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. API 키가 비어있는지 체크
  if (!apiKey) {
    return res.status(500).json({ error: "Vercel 설정에 GEMINI_API_KEY가 없습니다!" });
  }

  // 2. 2026년형 Gemini 3 Flash 모델 사용
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 정신분석학자입니다. 다음 꿈 답변을 분석하여 JSON으로 출력하세요. 
        분석 데이터: ${answers.join(" | ")}
        출력 형식(반드시 이 구조를 지키고, JSON 외의 텍스트는 출력하지 마세요):
        {
          "keywords": "키워드1 • 키워드2 • 키워드3",
          "rarity": "0.8%",
          "report": {
            "title": "분석 제목",
            "summary": "내용 요약"
          }
        }`
      }]
    }],
    generationConfig: {
      response_mime_type: "application/json" // AI가 무조건 JSON으로만 대답하도록 강제
    }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();
    
    // AI의 대답이 비어있거나 에러가 났을 경우 처리
    if (data.error) {
      return res.status(500).json({ error: "Google API 에러: " + data.error.message });
    }

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    res.status(200).json(result);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "분석 중 오류가 발생했습니다: " + error.message });
  }
}
