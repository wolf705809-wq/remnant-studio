// api/analyze.js - REMNANT MODEL AUTODETECT VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // 🚀 1. 이 키가 쓸 수 있는 모델 리스트를 먼저 가져옵니다.
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    
    // 쓸 수 있는 모델 중 'flash'가 들어간 가장 최신 모델을 찾습니다.
    const availableModels = listData.models || [];
    const bestModel = availableModels.find(m => m.name.includes('gemini-1.5-flash') || m.name.includes('gemini-2.0-flash'))?.name 
                      || "models/gemini-1.5-flash-latest"; // 못 찾으면 최신판으로 강제 지정

    console.log("Selected Model:", bestModel);

    // 🚀 2. 찾은 모델 주소로 분석 요청을 보냅니다.
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`;

    const promptData = {
      contents: [{
        parts: [{
          text: `You are a psychoanalyst. Analyze these dream fragments and return ONLY a valid JSON.
          Data: ${answers.join(" | ")}
          Format: {"keywords": "A • B • C", "rarity": "0.1%", "report": {"title": "Title", "summary": "Detailed analysis"}}`
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
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("Critical Error:", error.message);
    res.status(500).json({ error: "분석 불가: " + error.message });
  }
}
