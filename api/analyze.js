// api/analyze.js (최종 디버깅 & 보강 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERORR: GEMINI_API_KEY가 없습니다.");
    return res.status(500).json({ error: "API Key missing" });
  }

  // 가장 안정적인 모델 주소
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `당신은 정신분석학자입니다. 다음 꿈 답변을 분석하여 오직 JSON으로만 출력하세요. 
        데이터: ${answers.join(" | ")}
        출력 형식: {"keywords": "A • B • C", "rarity": "0.8%", "report": {"title": "제목", "summary": "요약"}}`
      }]
    }],
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();

    // 🚨 여기서 에러를 잡습니다 (로그에 전체 내용을 찍음)
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("AI 응답 구조 이상 발생! 전체 데이터:", JSON.stringify(data));
      return res.status(500).json({ error: "AI가 예상치 못한 대답을 보냈습니다." });
    }

    let rawText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(rawText));

  } catch (error) {
    console.error("서버 내부 오류:", error);
    res.status(500).json({ error: error.message });
  }
}
