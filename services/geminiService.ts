
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiVLCService {
  async reconstructMessage(rawSamples: string): Promise<{ text: string, confidence: number, reasoning: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `VLC_FAST_DECODE:
        - Rate: 7.5bps (133ms/bit)
        - Sample: 30Hz (~4 samples/bit)
        - Stream: ${rawSamples}
        
        TASK:
        Convert samples to bits (4 samples = 1 bit). 
        Format: [1-Start][8-Data][0-Stop].
        Return JSON only.`,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["text", "confidence"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        text: data.text || '[EMPTY]',
        confidence: data.confidence || 0,
        reasoning: data.reasoning || ''
      };
    } catch (error) {
      return { text: "[LINK_LOST]", confidence: 0, reasoning: "Latency error" };
    }
  }
}
