// api/analyze.js - REMNANT FINAL (Bypass Blocked Models)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    
    // 🚀 [해결 포인트] 구글이 막아둔 2.0 모델은 블랙리스트 처리하고, 접근 가능한 모델만 추려냅니다.
    const validModels = listData.models.filter(m => 
      m.supportedGenerationMethods?.includes("generateContent") && 
      !m.name.includes("gemini-2.0-flash") // 🚨 범인 강제 제외!
    );

    // 사용 가능한 모델 중 flash -> pro 순으로 가장 적합한 것을 찾습니다.
    const bestModel = validModels.find(m => m.name.includes("flash"))?.name 
                   || validModels.find(m => m.name.includes("pro"))?.name 
                   || validModels[0]?.name;

    console.log("최종 선택된 안전한 모델:", bestModel);

    if (!bestModel) throw new Error("현재 API 키로 사용할 수 있는 텍스트 분석 모델이 없습니다.");

    // 안전하게 찾은 모델 주소로 요청을 보냅니다.
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`;

    const promptData = {
      contents: [{
        parts: [{
          text: `You are a world-class psychoanalyst. Analyze these 7 dream fragments and return ONLY a valid JSON.
          Data: ${answers.join(" | ")}
          
          Required JSON Format:
          {
            "keywords": "WORD1 • WORD2 • WORD3",
            "rarity": "0.1%",
            "report": {
              "title": "A profound, philosophical title",
              "summary": "Deep, professional psychoanalytic report."
            }
          }`
        }]
      }]
    };

    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const resultText = data.candidates[0].content.parts[0].text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("AI가 JSON 형식을 지키지 않았습니다.");
    }

  } catch (error) {
    console.error("서버 에러 감지:", error.message);
    res.status(500).json({ error: "분석 불가: " + error.message });
  }
}
