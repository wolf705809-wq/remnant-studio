export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;

  const promptData = {
    contents: [{
      parts: [{
        text: `Analyze these 7 dream fragments and return ONLY a valid JSON. 
        Data: ${answers.join(" | ")}
        Format: {"keywords": "WORD1 • WORD2 • WORD3", "rarity": "0.7%", "report": {"title": "Title", "summary": "Summary"}}`
      }]
    }],
    // 💡 핵심: AI가 순수 JSON만 출력하도록 강제 설정
    generationConfig: {
      response_mime_type: "application/json"
    },
    // 💡 핵심: 안전 필터를 끄거나 완화하여 '정신 분석' 관련 거부 방지
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
        'x-goog-api-key': apiKey // 헤더 인증 방식 사용
      },
      body: JSON.stringify(promptData)
    });

    const data = await response.json();

    // API 응답 오류 확인 (상태 코드가 200이 아니거나 에러 객체가 있을 때)
    if (!response.ok || data.error) {
      console.error("Google API Error:", data.error || response.statusText);
      return res.status(response.status || 500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }

    // Optional Chaining(?.)을 사용하여 구조적 안전 확보
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.error("Empty Response - Check Safety Filters:", JSON.stringify(data));
      return res.status(500).json({ error: "결과를 생성할 수 없습니다. 프롬프트를 조정해주세요." });
    }

    // JSON 파싱 시도
    try {
      const parsedData = JSON.parse(textResponse);
      res.status(200).json(parsedData);
    } catch (parseError) {
      // JSON 파싱 실패 시 정규식으로 재시도
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.status(200).json(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error("Invalid JSON Format");
      }
    }

  } catch (error) {
    console.error("Critical Server Error:", error.message);
    res.status(500).json({ error: "분석 서버 오류가 발생했습니다." });
  }
}
