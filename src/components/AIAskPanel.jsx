import { useMemo, useState } from 'react';
import { Bot, Loader2, Send, Settings2, Sparkles, User } from 'lucide-react';
import Button from './Button';
import { askOllama, buildLifeOsContext } from '../utils/ollama';
import { loadFromStorage, saveToStorage } from '../utils/storage';

const starterMessages = [
  {
    role: 'assistant',
    content: "Hi Rayene. Would you like a quick update on your upcoming tasks and important dates?",
  },
];

export default function AIAskPanel({ events, tasks, goals, categories, completion }) {
  const [model, setModel] = useState(() => loadFromStorage('althair-ollama-model', loadFromStorage('lifeos-ollama-model', 'gemma3:latest')));
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(starterMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const context = useMemo(() => buildLifeOsContext({ events, tasks, goals, categories, completion }), [categories, events, goals, tasks, completion]);
  const hasConversation = messages.length > starterMessages.length || isLoading || error;

  function updateModel(value) {
    setModel(value);
    saveToStorage('althair-ollama-model', value);
  }

  async function submit(event) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage = { role: 'user', content: prompt };
    const chatHistory = [...messages.filter((message) => message.role !== 'assistant' || message.content !== starterMessages[0].content), userMessage];

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const answer = await askOllama({
        model,
        messages: chatHistory,
        context,
      });
      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    } catch (requestError) {
      setError(
        'Could not reach Ollama. Make sure Ollama is running, the model is installed, and the Vite dev server was restarted after this update.',
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: requestError.message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-cyan-100">
        <span className="flex items-center gap-2">
          <Sparkles size={17} />
          Ask Althair
        </span>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[8px] border border-white/8 bg-slate-950/34 px-3 py-2 text-xs text-white/52 transition hover:text-white/80">
            <Settings2 size={14} />
            {model}
          </summary>
          <label className="mt-2 block rounded-[8px] border border-white/8 bg-slate-950/80 p-3 text-xs text-white/56">
            Ollama model
            <input
              value={model}
              onChange={(event) => updateModel(event.target.value)}
              className="mt-2 w-full rounded-[8px] border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white outline-none focus:border-cyan-200/40"
            />
          </label>
        </details>
      </div>

      {!hasConversation && (
        <div className="rounded-[8px] border border-cyan-200/14 bg-gradient-to-br from-cyan-300/10 via-white/[0.045] to-fuchsia-300/10 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-cyan-300/12 text-cyan-100">
              <Bot size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-white/76">{starterMessages[0].content}</p>
              <button
                type="button"
                onClick={() => setInput('Give me a quick update on my upcoming tasks and important dates.')}
                className="mt-3 rounded-[8px] border border-cyan-200/18 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/36 hover:bg-cyan-300/14"
              >
                Prepare quick update
              </button>
            </div>
          </div>
        </div>
      )}

      {hasConversation && (
        <div className="thin-scrollbar max-h-72 space-y-3 overflow-auto rounded-[8px] border border-white/8 bg-slate-950/34 p-3">
          {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const Icon = isUser ? User : Bot;

          return (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-cyan-300/12 text-cyan-100">
                  <Icon size={16} />
                </div>
              )}
              <div
                className={`max-w-[78%] whitespace-pre-wrap rounded-[8px] border px-4 py-3 text-sm leading-6 ${
                  isUser
                    ? 'border-emerald-300/18 bg-emerald-300/10 text-white'
                    : 'border-cyan-200/14 bg-white/[0.055] text-white/76'
                }`}
              >
                {message.content}
              </div>
              {isUser && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-emerald-300/12 text-emerald-100">
                  <Icon size={16} />
                </div>
              )}
            </div>
          );
          })}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-white/58">
              <Loader2 size={17} className="animate-spin text-cyan-200" />
              Gemma is thinking locally...
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-amber-100/82">{error}</p>}

      <form onSubmit={submit} className="flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI about your deadlines, tasks, or schedule..."
          className="min-w-0 flex-1 rounded-[8px] border border-cyan-200/16 bg-slate-950/55 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200/42 focus:ring-2 focus:ring-cyan-200/10"
        />
        <Button type="submit" disabled={isLoading || !input.trim()} className="flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          Ask
        </Button>
      </form>
    </div>
  );
}
