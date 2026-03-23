// REMNANT AI 분석 엔진 (제미나이 3 Flash 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { answers } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // AI에게 보낼 지침 (12페이지 리포트 분량의 데이터를 요구함)
  const prompt = {
    contents: [{
      parts: [{
        text: `당신은 세계 최고의 라캉주의 정신분석학자입니다. 7가지 꿈 답변을 분석하여 럭셔리한 JSON 데이터를 출력하세요. 
        분석 데이터: ${answers.join(" | ")}
        출력 형식:
        {
          "keywords": "대문자 영문 키워드 3개 (예: VOID • VELVET • ECHO)",
          "rarity": "0.1% 단위의 희귀도",
          "report": {
            "title": "지적인 제목",
            "summary": "12페이지 분량의 심층 리포트를 요약한 전문적인 서술",
            "analysis": "구조적 무의식 분석 내용",
            "future": "미래의 심리적 변화 예측"
          }
        }`
      }]
    }]
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });
    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "AI 분석 실패" });
  }
}
