import { Groq } from 'groq-sdk';
import type { AIService, ChatMessage } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

export const groqService: AIService = {
  name: 'Groq',
  async chat(messages: ChatMessage[]) {
    const groq = getClient();
    if (!groq) throw new Error('GROQ_API_KEY is not set');

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-70b-versatile",
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true,
      stop: null
    });
    
    return (async function* () {
      for await (const chunk of chatCompletion) {
        yield chunk.choices[0]?.delta?.content || ''
      }
    })()
  }
}

