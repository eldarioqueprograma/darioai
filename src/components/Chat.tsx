import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_INPUT = 'Eres Dario AI. Tu creador es Dario. Responde en español, claro y conciso. Si no tienes información sobre algo, di que no la tienes y no intentes inventar nada. Si se te habla sobre programacion busca lo que te pide en canales como midudev o MoureDev';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payloadMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_INPUT },
        ...messages,
        userMessage
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let msg = raw;
        try {
          const json = JSON.parse(raw);
          msg = json.error || raw;
        } catch {
          msg = raw || `${response.status} ${response.statusText}`;
        }
        setMessages(prev => [...prev, { role: 'system', content: msg }]);
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al conectar con el servidor.';
      setMessages(prev => [...prev, { role: 'system', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6 font-sans">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/kiro.svg" alt="Dario AI" className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20" />

          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Dario AI
          </h1>
        </div>
        <div className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
          v2.0
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mb-6 p-4 space-y-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 shadow-inner backdrop-blur-sm scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <div className="p-4 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="font-medium">¿En qué puedo ayudarte hoy?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.role === 'system'
                  ? 'bg-red-900/20 text-red-200 border border-red-800 w-full text-center'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700'
              }`}
            >
              {msg.role !== 'user' && msg.role !== 'system' && (
                <div className="text-xs text-zinc-400 mb-1 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  AI Assistant
                </div>
              )}
              {msg.role === 'assistant' ? (
                <div className="leading-relaxed tracking-wide text-sm md:text-base">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} className="text-indigo-400 hover:text-indigo-300 underline" />
                      ),
                      pre: ({ node, ...props }) => (
                        <pre {...props} className="bg-zinc-900 rounded-lg p-3 overflow-x-auto border border-zinc-800" />
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !(className && /language-/.test(className));
                        return isInline ? (
                          <code {...props} className="bg-zinc-900 rounded px-1 py-0.5 border border-zinc-800">
                            {children}
                          </code>
                        ) : (
                          <code {...props} className={className}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mb-2" />,
                      h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-semibold mb-2" />,
                      ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1" />,
                      ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1" />,
                      p: ({ node, ...props }) => <p {...props} className="mb-2" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed tracking-wide text-sm md:text-base">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="w-full bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 border border-zinc-700/80 rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-900/20"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-zinc-600">
          Potenciado por Dario AI
        </div>
      </form>
    </div>
  );
}