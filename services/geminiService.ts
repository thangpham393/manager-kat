
import { GoogleGenAI } from "@google/genai";

export const getAIInsights = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Dưới đây là dữ liệu tài chính và vận hành của trung tâm tiếng Trung trong tháng qua:
    ${JSON.stringify(data)}
    
    Hãy phân tích:
    1. Tình hình lợi nhuận (Doanh thu vs Chi phí).
    2. Hiệu suất các lớp học.
    3. Đưa ra 3 lời khuyên cụ thể để tối ưu hóa doanh thu và giảm chi phí.
    Trả lời bằng tiếng Việt, ngắn gọn, súc tích dưới dạng markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Không thể tải phân tích AI vào lúc này. Vui lòng kiểm tra lại cấu hình API.";
  }
};
