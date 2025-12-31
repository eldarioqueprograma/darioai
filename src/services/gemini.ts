import { GoogleGenAI } from "@google/genai";
import type { AIService, ChatMessage } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const geminiService: AIService = {
  name: 'Gemini',
  async chat(messages: ChatMessage[]) {
    const ai = getClient();
    if (!ai) throw new Error('GEMINI_API_KEY is not set');
    
    const systemMessage = messages.find(m => m.role === 'system');
    
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const result = await ai.models.generateContentStream({
      model: "gemini-2.0-flash-exp",
      contents: contents,
      config: {
        systemInstruction: systemMessage?.content,
      }
    });

    return (async function* () {
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) yield text;
      }
    })();
  }
}

