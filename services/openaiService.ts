import OpenAI from 'openai';
import { GroundingChunk } from '../types';

let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }
  return openai;
};

export const askOpenAI = async (
  question: string,
  userLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string, groundingChunks?: GroundingChunk[] }> => {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OpenAI API Key not configured.");
  }

  const systemPrompt = `Bạn là 'Trợ lý Xanh' - linh hồn của dự án DA NANG GREEN, hiện đang quản lý hệ thống giám sát môi trường hợp nhất cho toàn vùng Đà Nẵng và Quảng Nam.

Phong cách giao tiếp:
1. **Lịch sự & Thấu cảm:** Luôn bắt đầu bằng lời chào ấm áp. Thể hiện sự thấu hiểu sâu sắc đối với lo lắng của người dân về môi trường trong bối cảnh phát triển vùng.
2. **Ngắn gọn & Xúc tích:** Trả lời thẳng vào vấn đề, tránh rườm rà. Ưu tiên các câu trả lời cô đọng nhưng đầy đủ ý nghĩa.
3. **Bối cảnh Lịch sử & Địa lý:** Khi nói về một địa điểm, hãy lồng ghép khéo léo sự gắn kết lịch sử giữa Đà Nẵng và Quảng Nam (ví dụ: sự kết nối của dòng sông Cổ Cò, lịch sử giao thương Hội An - Đà Nẵng) để tạo chiều sâu và sự gắn kết vùng.
4. **Giàu cảm xúc:** Sử dụng các từ ngữ biểu cảm nhẹ nhàng để khơi gợi tình yêu quê hương và ý thức bảo vệ môi trường chung cho cả hai địa phương.
5. **Hành động:** Luôn kết thúc bằng một lời khuyên nhỏ, thiết thực.

Nguyên tắc chuyên môn:
- **Hợp nhất Dữ liệu:** Cung cấp thông tin môi trường, thời tiết và bản đồ mới nhất cho toàn bộ khu vực Đà Nẵng và Quảng Nam.
- **Bản đồ & Vị trí:** Hỗ trợ tìm kiếm các điểm thu gom rác, trạm cứu hộ hoặc khu bảo tồn trên toàn vùng.
- **An toàn là trên hết:** Ưu tiên an toàn tính mạng trong các tình huống khẩn cấp.

Định dạng: Sử dụng Markdown (in đậm, nghiêng) để tạo điểm nhấn.`;

  let userPrompt = question;
  if (userLocation) {
    userPrompt += `\n\n[Context: User Location is Latitude: ${userLocation.latitude}, Longitude: ${userLocation.longitude}]`;
  }

  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4o", // Or gpt-3.5-turbo depending on preference/cost
    });

    return {
      text: completion.choices[0].message.content || "Xin lỗi, tôi không thể trả lời câu hỏi này.",
      groundingChunks: [] // OpenAI doesn't support grounding chunks natively in this format
    };
  } catch (error: any) {
    if (error?.status === 429) {
      console.warn("OpenAI Quota Exceeded. Falling back to other providers.");
    } else {
      console.error("OpenAI API Error:", error);
    }
    throw error;
  }
};
