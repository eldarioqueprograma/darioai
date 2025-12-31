import Cerebras from '@cerebras/cerebras_cloud_sdk';
import type { AIService, ChatMessage } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.CEREBRAS_API_KEY || process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;
  return new Cerebras({ apiKey });
};

export const cerebrasService: AIService = {
  name: 'Cerebras',
  async chat(messages: ChatMessage[]) {
    const cerebras = getClient();
    if (!cerebras) throw new Error('CEREBRAS_API_KEY is not set');

    const stream = await cerebras.chat.completions.create({
      messages: messages as any,
      model: 'zai-glm-4.6',
      stream: true,
      max_completion_tokens: 40960,
      temperature: 0.6,
      top_p: 0.95
    });

    return (async function* () {
      for await (const chunk of stream) {
        yield (chunk as any).choices[0]?.delta?.content || ''
      }
    })()
  }
}