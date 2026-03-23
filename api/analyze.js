// api/analyze.js - REMNANT MASTER DEBUG (최종)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("--- 서버 시작 ---");
  console.log("API Key 확인:", apiKey ? "있음(OK)" : "없음(Error)");

  if (!apiKey) return res.status(500).json({ error: "환경변수 설정 오류" });

  // 🚀 모든 불필요한 설정을 뺀 가장 기초적인 요청 주소
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptData = {
    contents: [{
      parts: [{
        text: `Analyze these 7 dream fragments and output ONLY JSON: ${answers.join(" | ")}. Structure: {"keywords": "A • B • C", "rarity": "0.1%", "report": {"title": "Title", "summary": "Detailed analysis"}}`
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
    console.log("구글 서버 응답 전체:", JSON.stringify(data));

    if (data.error) {
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    // 결과 추출 로직 (안전 장치 강화)
    const resultText = data.candidates[0].content.parts[0].text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("최종 에러 로그:", error.message);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
