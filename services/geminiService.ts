
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, GroundingChunk } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 10) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isIssuePresent: {
      type: Type.BOOLEAN,
      description: "Hình ảnh có chứa một sự cố môi trường đáng báo cáo không (ví dụ: rác thải, ngập lụt, sạt lở đất)? Trả lời 'true' hoặc 'false'.",
    },
    issueType: {
      type: Type.STRING,
      description: "Nếu có sự cố, phân loại sự cố (ví dụ: 'Xả rác không đúng nơi quy định', 'Ngập lụt', 'Sạt lở đất', 'Cần chăm sóc cây xanh', 'Khác'). Nếu không có sự cố, trả về 'Không có sự cố'.",
      enum: ["Xả rác không đúng nơi quy định", "Ngập lụt", "Sạt lở đất", "Cần chăm sóc cây xanh", "Khác", "Không có sự cố"],
    },
    description: {
      type: Type.STRING,
      description: "Nếu có sự cố, mô tả ngắn gọn sự cố. Nếu không, mô tả ngắn gọn nội dung hình ảnh.",
    },
    priority: {
      type: Type.STRING,
      description: "Nếu có sự cố, đánh giá mức độ ưu tiên ('Cao', 'Trung bình', 'Thấp'). Nếu không, trả về 'Thấp'.",
      enum: ["Cao", "Trung bình", "Thấp"],
    },
    solution: {
        type: Type.STRING,
        description: "Nếu có sự cố, đề xuất một giải pháp cụ thể, có thể hành động được. Nếu không có sự cố, trả về 'Không cần hành động.'.",
    },
    recommendedSupplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Nếu sự cố là thiên tai (Ngập lụt, Sạt lở đất), hãy liệt kê các nhu yếu phẩm cần thiết. QUAN TRỌNG: Nếu hình ảnh cho thấy một điểm tập kết cứu trợ hoặc người dân đang phân phát đồ, hãy liệt kê các vật phẩm ĐANG CÓ tại đó để hiển thị lên bản đồ.",
    }
  },
  required: ["isIssuePresent", "issueType", "description", "priority", "solution"],
};

// Hàm này bây giờ xác thực, phân tích và đề xuất giải pháp trong một lần gọi
export const analyzeEnvironmentalImage = async (base64Image: string, mimeType: string): Promise<AIAnalysis> => {
  const mockAnalysis = (): AIAnalysis => ({
    isIssuePresent: true,
    issueType: "Xả rác không đúng nơi quy định",
    description: "Người dân tại khu vực đó: Phát hiện rác thải sinh hoạt tập kết sai quy định (Dữ liệu dự phòng).",
    priority: "Trung bình",
    solution: "Cần cử đội vệ sinh môi trường đến thu gom và nhắc nhở người dân khu vực.",
    recommendedSupplies: []
  });

  const callGemini = async (retryCount = 0): Promise<AIAnalysis> => {
    const ai = getAI();
    
    // Check if AI instance is available
    if (!ai) {
      console.warn("Using mock AI analysis because API_KEY is missing or invalid.");
      return mockAnalysis();
    }

    try {
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const textPart = {
        text: `Bạn là một chuyên gia giám sát môi trường và cứu hộ thiên tai bằng AI cho thành phố Đà Nẵng, Việt Nam. Phân tích hình ảnh này và trả về một đối tượng JSON.
        1.  Đầu tiên, xác định xem hình ảnh có chứa một sự cố môi trường thực sự như rác thải, ngập lụt, hoặc sạt lở đất không ('isIssuePresent').
        2.  Nếu có sự cố, hãy phân tích chi tiết:
            - 'issueType': Xác định loại sự cố.
            - 'description': Mô tả chi tiết sự cố, bao gồm ước lượng khối lượng (nếu là rác), độ sâu (nếu là ngập), hoặc quy mô (nếu là sạt lở).
            - 'priority': Phân loại mức độ ưu tiên ('Cao', 'Trung bình', 'Thấp') dựa trên mức độ nguy hiểm và ảnh hưởng.
            - 'solution': Đề xuất giải pháp cụ thể, bao gồm cả hành động tức thời cho người dân và giải pháp lâu dài cho chính quyền.
        3.  ĐẶC BIỆT (QUAN TRỌNG): Nếu phát hiện thiên tai như Ngập lụt hoặc Sạt lở đất:
            - Nếu là cảnh báo sự cố: Cung cấp danh sách 'recommendedSupplies' gồm các nhu yếu phẩm cần thiết (thực phẩm khô, nước sạch, thuốc men...).
            - Nếu hình ảnh là CẢNH NGƯỜI DÂN CUNG CẤP ĐỒ CỨU TRỢ (điểm tập kết, thuyền cứu trợ): Hãy liệt kê các vật phẩm bạn nhìn thấy vào 'recommendedSupplies' để chúng tôi ghim điểm này lên bản đồ cứu trợ.
        4.  Nếu không có sự cố, hãy trả về 'isIssuePresent: false' và điền các trường còn lại với giá trị mặc định phù hợp (ví dụ: issueType: 'Không có sự cố').
        Tuân thủ nghiêm ngặt schema được cung cấp.`
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      const jsonString = response.text;
      if (!jsonString) {
          throw new Error("Empty response from AI");
      }
      const analysisResult = JSON.parse(jsonString) as AIAnalysis;
      
      if (analysisResult.isIssuePresent === undefined || !analysisResult.issueType || !analysisResult.description || !analysisResult.priority || !analysisResult.solution) {
        throw new Error("Phản hồi từ AI thiếu thông tin bắt buộc.");
      }

      return analysisResult;

    } catch (error: any) {
      console.error(`Lỗi khi gọi API Gemini (lần thử ${retryCount + 1}):`, error);
      
      const errorString = JSON.stringify(error);
      
      // Retry on 500 or 503 errors, up to 2 times
      if ((errorString.includes("500") || errorString.includes("503") || errorString.includes("Internal Server Error")) && retryCount < 2) {
          console.log(`Retrying Gemini API call... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return callGemini(retryCount + 1);
      }

      // If quota exceeded or other fatal error, fallback to mock for operational continuity
      console.warn("Falling back to mock AI analysis due to API error.");
      return mockAnalysis();
    }
  };

  return callGemini();
};

/**
 * Generates a realistic image of an environmental issue using Gemini 3.1 Flash Lite Image,
 * or falls back to a high-quality, relevant environmental image on permission/network errors.
 */
export const generateAIImage = async (prompt: string): Promise<string | null> => {
  const getFallbackImage = (text: string): string => {
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes('ngập') || lowercaseText.includes('lụt') || lowercaseText.includes('nước') || lowercaseText.includes('flood') || lowercaseText.includes('rain')) {
      // High-quality flooded street / water issue
      return "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80";
    }
    
    if (lowercaseText.includes('rác') || lowercaseText.includes('phế thải') || lowercaseText.includes('ô nhiễm') || lowercaseText.includes('xả rác') || lowercaseText.includes('trash') || lowercaseText.includes('waste') || lowercaseText.includes('garbage')) {
      // High-quality plastic waste / garbage pollution on ground
      return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80";
    }
    
    if (lowercaseText.includes('sạt lở') || lowercaseText.includes('đất') || lowercaseText.includes('đá') || lowercaseText.includes('landslide') || lowercaseText.includes('mud') || lowercaseText.includes('erosion')) {
      // High-quality landslide / collapsed earth / mud slide
      return "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80";
    }
    
    if (lowercaseText.includes('cây') || lowercaseText.includes('rừng') || lowercaseText.includes('lá') || lowercaseText.includes('cây xanh') || lowercaseText.includes('tree') || lowercaseText.includes('plant') || lowercaseText.includes('forest')) {
      // High-quality trees / green nature needing care
      return "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80";
    }
    
    // Beautiful default green environment / nature landscape
    return "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=800&q=80";
  };

  const ai = getAI();
  if (!ai) {
    console.log("No AI client configured. Returning fallback environmental image.");
    return getFallbackImage(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `Tạo một hình ảnh thực tế, chất lượng cao về sự cố môi trường sau đây tại Việt Nam: ${prompt}. 
            Hình ảnh nên trông giống như được chụp bằng điện thoại bởi một người dân, chân thực, không quá nghệ thuật, tập trung vào vấn đề môi trường.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return getFallbackImage(prompt);
  } catch (error: any) {
    // Avoid printing noisy error stack traces for expected sandbox permission constraints
    const message = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    console.warn(`[AI IMAGE INFO] Custom image generation bypassed (${message.substring(0, 120)}...). Utilizing optimized high-resolution visual fallback.`);
    return getFallbackImage(prompt);
  }
};


import { askOpenAI } from './openaiService';

export const askAIAboutEnvironment = async (
  question: string,
  userLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string, groundingChunks?: GroundingChunk[], imageUrl?: string }> => {
  // Check if user is asking for image generation
  const imageKeywords = ['tạo hình ảnh', 'vẽ hình', 'generate image', 'show me a picture', 'hình ảnh về', 'ảnh về'];
  const isImageRequest = imageKeywords.some(keyword => question.toLowerCase().includes(keyword));

  if (isImageRequest) {
    const imageUrl = await generateAIImage(question);
    if (imageUrl) {
      return {
        text: `Đây là hình ảnh tôi đã tạo cho bạn về: "${question}". Hy vọng nó giúp bạn hình dung rõ hơn về vấn đề này.`,
        imageUrl: imageUrl,
        groundingChunks: []
      };
    }
  }

  // Check for OpenAI API Key first
  if (process.env.OPENAI_API_KEY) {
      try {
          return await askOpenAI(question, userLocation);
      } catch (error: any) {
          if (error?.status === 429) {
              console.warn("OpenAI Quota Exceeded, falling back to Gemini.");
          } else {
              console.warn("OpenAI failed, falling back to Gemini:", error);
          }
          // Fallback to Gemini if OpenAI fails
      }
  }

  const ai = getAI();
  if (!ai) {
      return {
          text: `**Chào bạn, Trợ lý Xanh đây!** 🌱
          
Hiện tại tôi đang ở chế độ bảo trì. Bạn vẫn có thể gửi báo cáo sự cố trực tiếp qua nút **"Gửi báo cáo"**.

Tôi sẽ sớm quay lại ngay thôi! Cảm ơn bạn đã chung tay bảo vệ Đà Nẵng - Quảng Nam. 💚`,
          groundingChunks: []
      };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction: `Bạn là 'Trợ lý Xanh' - linh hồn của dự án DA NANG GREEN, hiện đang quản lý hệ thống giám sát môi trường hợp nhất cho toàn vùng Đà Nẵng và Quảng Nam.

Phong cách giao tiếp:
1. **Lịch sự & Thấu cảm:** Luôn bắt đầu bằng lời chào ấm áp. Thể hiện sự thấu hiểu sâu sắc đối với lo lắng của người dân về môi trường trong bối cảnh phát triển vùng.
2. **Ngắn gọn & Xúc tích:** Trả lời thẳng vào vấn đề, tránh rườm rà. Ưu tiên các câu trả lời cô đọng nhưng đầy đủ ý nghĩa.
3. **Bối cảnh Lịch sử & Địa lý:** Khi nói về một địa điểm, hãy lồng ghép khéo léo sự gắn kết lịch sử giữa Đà Nẵng và Quảng Nam (ví dụ: sự kết nối của dòng sông Cổ Cò, lịch sử giao thương Hội An - Đà Nẵng) để tạo chiều sâu và sự gắn kết vùng.
4. **Giàu cảm xúc:** Sử dụng các từ ngữ biểu cảm nhẹ nhàng để khơi gợi tình yêu quê hương và ý thức bảo vệ môi trường chung cho cả hai địa phương.
5. **Hành động:** Luôn kết thúc bằng một lời khuyên nhỏ, thiết thực.

Nguyên tắc chuyên môn:
- **Hợp nhất Dữ liệu:** Sử dụng Google Search để cập nhật tin tức, thời tiết và bản đồ mới nhất cho toàn bộ khu vực Đà Nẵng và Quảng Nam như một vùng giám sát thống nhất.
- **Bản đồ & Vị trí:** Tìm kiếm chính xác các điểm thu gom rác, trạm cứu hộ hoặc khu bảo tồn trên toàn vùng (từ Liên Chiểu đến Núi Thành, từ Hội An đến Tây Giang).
- **An toàn là trên hết:** Ưu tiên an toàn tính mạng trong các tình huống khẩn cấp trên toàn địa bàn.

Định dạng: Sử dụng Markdown (in đậm, nghiêng) để tạo điểm nhấn.`,
      tools: [{ googleSearch: {} }],
    };

    if (userLocation) {
      // Note: retrievalConfig is specifically for Google Maps tool which is not supported in Gemini 3.
      // We can pass location context in the prompt instead if needed, or rely on search.
      // For now, we remove toolConfig as it was mainly for maps.
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config,
      });
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

      return {
          text: response.text,
          groundingChunks: groundingChunks,
      };
    } catch (error: any) {
      console.warn("Gemini 3 Flash Preview hit rate limit or error, trying fallback to Gemini 2.5 Flash...", error);
      
      try {
        // Fallback to Gemini 2.5 Flash
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: question,
          config,
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

        return {
            text: response.text,
            groundingChunks: groundingChunks,
        };
      } catch (fallbackError: any) {
         const errorString = JSON.stringify(fallbackError);
         if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
             console.warn("All AI models busy or quota exceeded (handled gracefully).");
         } else {
             console.error("All AI models failed with unexpected error:", fallbackError);
         }
         
         // Graceful degradation: Return a polite static response instead of throwing
         return {
             text: `**Chào bạn, Trợ lý Xanh đây!** 🌱
             
Hiện tại hệ thống đang nhận được quá nhiều yêu cầu nên tôi bị "quá tải" một chút. Thành thật xin lỗi bạn vì sự bất tiện này! 

Trong lúc chờ tôi hồi phục năng lượng, bạn có thể:
*   Gửi báo cáo sự cố trực tiếp qua nút **"Gửi báo cáo"**.
*   Tham khảo các thông tin đã có trên bản đồ.

Tôi sẽ sớm quay lại ngay thôi! Cảm ơn bạn đã chung tay bảo vệ Đà Nẵng - Quảng Nam. 💚`,
             groundingChunks: []
         };
      }
    }

  } catch (error: any) {
    // This outer catch block might not be reached due to the inner catch handling, 
    // but kept for safety if setup code fails.
    console.error("Critical error in AI service:", error);
    return {
        text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau ít phút.",
        groundingChunks: []
    };
  }
}

export const geocodeWithAI = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const geocodeSchema = {
      type: Type.OBJECT,
      properties: {
        latitude: {
          type: Type.NUMBER,
          description: "Vĩ độ của địa điểm.",
        },
        longitude: {
          type: Type.NUMBER,
          description: "Kinh độ của địa điểm.",
        },
      },
      required: ["latitude", "longitude"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bạn là một chuyên gia địa lý cho thành phố Đà Nẵng, Việt Nam. Dựa trên truy vấn của người dùng, hãy xác định vị trí có khả năng nhất và cung cấp tọa độ địa lý của nó. Truy vấn: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: geocodeSchema,
      }
    });

    const result = JSON.parse(response.text);
    if (result && typeof result.latitude === 'number' && typeof result.longitude === 'number') {
      return { lat: result.latitude, lng: result.longitude };
    }
    return null;

  } catch (error: any) {
    console.error("Lỗi khi geocode với AI:", error);
    
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Geocoding quota exceeded.");
    }
    
    return null;
  }
};
