// api/analyze.js - Auto-Detect Model & Korean JSON
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 1. 이 API 키로 쓸 수 있는 모델 리스트를 먼저 가져옵니다.
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  let bestModel = "models/gemini-pro"; // 만약을 대비한 가장 안정적인 기본 모델

  try {
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    
    if (listData.models) {
      // 텍스트 생성(generateContent)이 가능하고, 시각(vision) 모델이 아닌 것만 추려냅니다.
      const validModels = listData.models.filter(m => 
        m.supportedGenerationMethods?.includes("generateContent") && 
        !m.name.includes("vision")
      );

      // 쓸 수 있는 모델 중 최신 flash나 pro 모델을 찾아서 자동 지정합니다.
      const foundModel = validModels.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                         validModels.find(m => m.name.includes("gemini-pro"))?.name ||
                         validModels[0]?.name;
                         
      if (foundModel) bestModel = foundModel;
      console.log("자동 선택된 안전한 모델:", bestModel);
    }
  } catch (e) {
    console.warn("모델 탐색 실패, 기본 모델로 강제 진행합니다.");
  }

  // 🚀 2. 찾아낸 안전한 모델로 분석을 요청합니다.
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `당신은 사람의 심리를 꿰뚫어보는 통찰력 있는 한국의 심리 분석가입니다. 딱딱한 번역투를 버리고, 유저가 공감할 수 있는 다정하고 감성적인 한국어 문장으로 다음 7가지 꿈의 조각들을 분석해 주세요.
        
        유저 답변: ${answers.join(" | ")}
        
        반드시 다음 JSON 형식으로만 응답하세요:
        {
          "keywords": "단어1 • 단어2 • 단어3", 
          "rarity": "신중한 관찰자 (성향을 나타내는 멋진 수식어)", 
          "report": {
            "title": "감성적이고 은유적인 한국어 제목", 
            "summary": "마치 편지를 읽는 것처럼 부드럽고 자연스러운 한국어 문체로 유저의 내면을 위로하고 통찰하는 분석 리포트 (300자 이상)"
          }
        }`
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json" // 🚀 [필수] 무조건 JSON으로만 답하게 강제
    }
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "구글 서버 응답 오류");

    const jsonText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(jsonText));

  } catch (error) {
    console.error("Critical Server Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
