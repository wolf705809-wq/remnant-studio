// api/analyze.js (제미나이 버전)
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. 제미나이 열쇠 설정 (Vercel 환경 변수에서 가져옴)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { answers } = req.body;
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // JSON 출력 강제
  });

  const prompt = `
    당신은 세계 최고의 정신분석학자입니다. 
    다음 7가지 답변을 분석하여 럭셔리한 꿈 분석 데이터를 JSON으로 출력하세요.
    응답 형식:
    {
      "keywords": "대문자 영문 키워드 3개 (예: VOID • VELVET • ECHO)",
      "rarity": "0.1% 단위의 희귀도",
      "report": {
        "title": "지적인 제목",
        "summary": "품격 있는 분석 요약"
      }
    }
    분석할 데이터: ${answers.join(" | ")}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.status(200).json(JSON.parse(response.text()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini Analysis Failed" });
  }
}
