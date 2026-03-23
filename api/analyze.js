// api/analyze.js - REMNANT KOREAN NATURAL VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 🇰🇷 AI에게 '한국 감성'의 자연스러운 문장 생성을 지시합니다.
  const promptData = {
    contents: [{
      parts: [{
        text: `당신은 사람의 심리를 꿰뚫어보는 감성적이고 통찰력 있는 한국의 심리 분석가입니다. 딱딱한 번역투나 학술적인 용어를 피하고, 유저가 공감할 수 있는 부드럽고 시적인 한국어 문장으로 다음 7가지 꿈의 조각들을 분석해 주세요.
        
        유저의 답변: ${answers.join(" | ")}
        
        반드시 아래의 JSON 형식으로만 응답해야 합니다:
        {
          "keywords": "단어1 • 단어2 • 단어3", 
          "rarity": "신중한 관찰자 (예시: 성향이나 특징을 나타내는 멋진 수식어)", 
          "report": {
            "title": "공감가고 감성적인 한국어 제목", 
            "summary": "유저의 내면 상태와 무의식을 위로하고 통찰하는 내용. 마치 에세이나 편지를 읽는 것처럼 부드럽고 자연스러운 한국어 문체로 300자 이상 작성해 주세요. (예: '당신은 아마 현실에서...', '이 꿈은 당신이 ~하고 싶다는 내면의 목소리일지 모릅니다.')"
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
    if (data.error) throw new Error(data.error.message);

    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("AI가 유효한 JSON을 반환하지 않았습니다.");
    }

  } catch (error) {
    console.error("Critical Server Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
