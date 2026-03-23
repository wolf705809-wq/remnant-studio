// api/analyze.js - REMNANT SAFE MODE (100% Compatibility)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 오류를 피하기 위해 v1beta 주소를 사용합니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 정신분석학자입니다. 다음 꿈 답변 7개를 분석하여 오직 JSON 형식으로만 응답하세요. 
        분석 데이터: ${answers.join(" | ")}
        
        반드시 아래의 JSON 구조만 출력하세요(다른 설명은 하지 마세요):
        {
          "keywords": "단어1 • 단어2 • 단어3",
          "rarity": "0.7%",
          "report": {
            "title": "분석 보고서 제목",
            "summary": "여기에 최소 500자 이상의 심층적인 정신분석 내용을 적으세요. 라캉, 융의 이론을 언급하며 매우 전문적이고 길게 서술하세요."
          }
        }`
      }]
    }]
    // 🚀 [수정] 오류의 원인이었던 generationConfig 섹션을 통째로 제거하여 호환성을 높였습니다.
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

    // AI의 대답에서 JSON만 추출하는 안전 로직
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
