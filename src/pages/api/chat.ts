import type { APIRoute } from 'astro';
export const prerender = false;
import { groqService } from '../../services/groq';
import { cerebrasService } from '../../services/cerebras';
import { geminiService } from '../../services/gemini';
import type { AIService, ChatMessage } from '../../types';

const services: AIService[] = [groqService, cerebrasService, geminiService];

let currentServiceIndex = 0;

async function getStreamWithFallback(messages: ChatMessage[]) {
  let attempts = 0;
  let index = currentServiceIndex;
  while (attempts < services.length) {
    const service = services[index];
    try {
      const stream = await service.chat(messages);
      currentServiceIndex = (index + 1) % services.length;
      return { serviceName: service.name, stream };
    } catch (e) {
      index = (index + 1) % services.length;
      attempts += 1;
    }
  }
  throw new Error('No hay servicios de IA disponibles');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let messages: ChatMessage[] | undefined;
    try {
      const raw = await request.text();
      const body = raw ? JSON.parse(raw) : null;
      messages = body?.messages as ChatMessage[] | undefined;
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido en el cuerpo de la solicitud' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { serviceName, stream } = await getStreamWithFallback(messages);
    console.log(`Using ${serviceName} service`);

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
