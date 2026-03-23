// Node.js 환경에서 실행되는 Vercel Serverless Function입니다.
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Vercel Settings에서 설정할 비밀키
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { answers } = req.body; 
  const combinedAnswers = answers.join(" | ");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `당신은 세계 최고의 라캉주의 정신분석학자이자 기호학자입니다. 
          유저의 꿈 답변을 분석하여 다음 JSON 형식으로만 응답하세요. 
          반드시 지적이고, 추상적이며, 럭셔리한 영문 용어를 사용하세요.
          
          {
            "keywords": "대문자 영문 키워드 3개 (예: VOID • VELVET • ECHO)",
            "rarity": "0.1% 단위의 희귀도 (예: 0.8%)",
            "report": {
              "title": "꿈의 분석 제목",
              "summary": "전체적인 무의식 구조 요약 (300자 내외)",
              "symbols": ["핵심 상징 1", "핵심 상징 2", "핵심 상징 3"],
              "analysis": "정신분석학적 관점의 심층 분석 내용 (800자 내외)",
              "future": "이 꿈이 암시하는 미래의 심리적 변화"
            }
          }`
        },
        { role: "user", content: `User's Dream Fragments: ${combinedAnswers}` }
      ],
      response_format: { type: "json_object" }
    });

    const analysisData = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(analysisData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI Synthesis Failed" });
  }
}
