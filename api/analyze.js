// api/analyze.js - REMNANT FINAL STABLE VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Vercel 환경변수에서 API Key를 찾을 수 없습니다." });

  // 🚀 [핵심 수정] v1beta를 v1으로 변경하여 404 에러를 원천 차단합니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 정신분석학자입니다. 다음 꿈 답변 7개를 분석하여 오직 JSON 형식으로만 응답하세요. 
        분석 데이터: ${answers.join(" | ")}
        
        반드시 아래의 JSON 구조만 출력하세요:
        {
          "keywords": "단어1 • 단어2 • 단어3",
          "rarity": "0.7%",
          "report": {
            "title": "분석 보고서 제목",
            "summary": "여기에 매우 전문적이고 긴 정신분석 내용을 적으세요."
          }
        }`
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
      console.error("Google API Response Error:", JSON.stringify(data.error));
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // 결과 추출 및 JSON 정제
    const resultText = data.candidates[0].content.parts[0].text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("Invalid AI Response Format");
    }

  } catch (error) {
    console.error("Server Side Error:", error.message);
    res.status(500).json({ error: "분석 서버 오류가 발생했습니다." });
  }
}
