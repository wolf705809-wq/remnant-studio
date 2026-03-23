export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key가 설정되지 않았습니다." });
  }

  // 모델명을 gemini-1.5-flash로 고정 (가장 안정적입니다)
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 정신분석학자입니다. 다음 꿈 답변을 분석하여 오직 JSON 형식으로만 출력하세요. 
        분석 데이터: ${answers.join(" | ")}
        출력 형식:
        {
          "keywords": "키워드1 • 키워드2 • 키워드3",
          "rarity": "0.8%",
          "report": {
            "title": "분석 제목",
            "summary": "내용 요약"
          }
        }`
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
    
    // AI의 대답 추출 및 마크다운 제거 로직 추가
    let rawText = data.candidates[0].content.parts[0].text;
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(cleanText);
    res.status(200).json(result);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
