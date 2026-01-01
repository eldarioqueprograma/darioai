import type { APIRoute } from 'astro';
import { groqService } from './services/groq';
import { cerebrasService } from './services/cerebras';
import { geminiService } from './services/gemini';
import type { AIService, ChatMessage } from '../../types';

export const prerender = false;

const services: AIService[] = [groqService, cerebrasService, geminiService];
let currentServiceIndex = 0;

// Helper para convertir AsyncIterable a ReadableStream
function iteratorToStream(iterator: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      try {
        // @ts-ignore - AsyncIterable iterator handling
        const reader = iterator[Symbol.asyncIterator]();
        const { value, done } = await reader.next();
        
        if (done) {
          controller.close();
        } else {
          controller.enqueue(encoder.encode(value));
          
          // Continuar leyendo el resto del iterador
          while (true) {
            const { value, done } = await reader.next();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(encoder.encode(value));
          }
        }
      } catch (e) {
        controller.error(e);
      }
    }
  });
}

// Versión simplificada del helper que funciona mejor con iteradores
function asyncIterableToStream(iterable: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    }
  });
}

async function getStreamWithFallback(messages: ChatMessage[]) {
  let attempts = 0;
  let index = currentServiceIndex;
  
  const servicesToTry = Array.from({ length: services.length }, (_, i) => 
    services[(index + i) % services.length]
  );

  for (const service of servicesToTry) {
    try {
      console.log(`Intentando con servicio: ${service.name}`);
      const generator = await service.chat(messages);
      
      currentServiceIndex = services.indexOf(service); 
      
      return { 
        serviceName: service.name, 
        stream: asyncIterableToStream(generator) 
      };
    } catch (e) {
      console.error(`Fallo servicio ${service.name}:`, e);
      attempts++;
    }
  }
  
  throw new Error(`Todos los servicios de IA fallaron después de ${attempts} intentos.`);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let messages: ChatMessage[] = [];
    try {
      const body = await request.json();
      messages = body.messages;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    const { serviceName, stream } = await getStreamWithFallback(messages);
    console.log(`Conectado exitosamente con ${serviceName}`);

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error fatal en /api/chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor de chat' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
