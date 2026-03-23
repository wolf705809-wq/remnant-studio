// api/analyze.js - 최종 안정화 버전 (프롬프트 순화 및 필드명 수정 완료)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  // v1 API 엔드포인트
  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;

  const promptData = {
    contents: [{
      parts: [{
        // 🚀 [수정] 프롬프트 순화: "psychoanalyst" -> "creative dream metaphor expert"
        text: `You are a creative dream metaphor expert. Analyze these 7 dream fragments and return ONLY a valid JSON.
        Data: ${answers.join(" | ")}
        Format: {"keywords": "WORD1 • WORD2 • WORD3", "rarity": "0.7%", "report": {"title": "Title", "summary": "Summary"}}`
      }]
    }],
    generationConfig: {
      // 🚀 [수정] snake_case에서 camelCase로 변경 (에러 해결 포인트)
      responseMimeType: "application/json"
    },
    // 🚀 [추가] 안전 필터 완화: 분석 거부 방지
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey 
      },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    // API 응답 상태 확인
    if (!response.ok) {
      console.error("Google API Error:", JSON.stringify(data.error));
      return res.status(response.status).json({ error: data.error?.message || "API 호출 실패" });
    }

    // 데이터 추출 (Optional Chaining으로 안전하게 접근)
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Empty AI Response");
    }

    // JSON 파싱 및 반환
    try {
      // responseMimeType 설정 덕분에 대부분 순수 JSON만 들어오지만, 
      // 만약의 경우를 대비해 정규식 추출 로직을 유지합니다.
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const finalJson = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse);
      
      res.status(200).json(finalJson);
    } catch (parseError) {
      console.error("JSON Parse Error:", textResponse);
      throw new Error("Invalid JSON Format from AI");
    }

  } catch (error) {
    console.error("Critical Server Error:", error.message);
    res.status(500).json({ error: "꿈을 분석하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
  }
}
