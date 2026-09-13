import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { aiService } from '../services/aiService';

const SUGGESTIONS = [
  'What should I learn next?',
  'Which applications should I prioritize?',
  'How is my resume performing against my saved jobs?',
  'What are my strengths based on my recent interviews?',
];

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your AI Career Assistant. I can see your resume, applications, and interview history — ask me anything about your job search." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const message = text ?? input;
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');
    setSending(true);
    try {
      const res = await aiService.chat(message);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assistant failed to respond');
      setMessages((prev) => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Career Assistant</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your job search..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
