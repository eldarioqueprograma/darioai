export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const envCheck = {
    GEMINI: !!(import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
    GROQ: !!(import.meta.env.GROQ_API_KEY || process.env.GROQ_API_KEY),
    CEREBRAS: !!(import.meta.env.CEREBRAS_API_KEY || process.env.CEREBRAS_API_KEY),
    NODE_ENV: process.env.NODE_ENV,
    TIME: new Date().toISOString()
  };

  return new Response(JSON.stringify(envCheck), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
