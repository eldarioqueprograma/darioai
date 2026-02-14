import { Groq } from 'groq-sdk';
import type { AIService, ChatMessage } from '../../../types';

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

    const model =
      (import.meta as any).env?.GROQ_MODEL ||
      process.env.GROQ_MODEL ||
      "llama-3.1-8b-instant";

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 1,
      max_completion_tokens: 1024,
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
