import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Sparkles,
  Bot,
  RefreshCw
} from "lucide-react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "👋 Welcome to ChainAI Assistant.\nHow can I help your business today?"
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const reply = (msg: string) => {
    const text = msg.toLowerCase();

    if (text.includes("hi"))
      return "👋 Hello! Welcome back.";

    if (text.includes("stock"))
      return "📦 Inventory looks healthy.";

    if (text.includes("sales"))
      return "💰 Sales are growing steadily.";

    if (text.includes("help"))
      return "🤖 Ask me about stock, sales, revenue or products.";

    return "🤖 I understood your request. Please give more details.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const msg = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg }
    ]);

    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: reply(msg)
        }
      ]);
      setLoading(false);
    }, 700);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content:
          "👋 Welcome to ChainAI Assistant.\nHow can I help your business today?"
      }
    ]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[410px] h-[620px] rounded-[34px] overflow-hidden bg-white shadow-[0_25px_80px_rgba(0,0,0,0.15)] border border-slate-100 mb-5 flex flex-col animate-in slide-in-from-bottom-10 duration-300">

          {/* Header */}
          <div className="relative p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">

            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Bot className="text-white w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg">
                    ChainAI
                  </h3>
                  <p className="text-white/70 text-xs">
                    Smart Assistant Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={resetChat}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-5 bg-gradient-to-b from-slate-50 to-white space-y-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-3xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md shadow-lg"
                      : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-3xl rounded-bl-md shadow-md border border-slate-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2 bg-white">
            {[
              "Stock",
              "Sales",
              "Revenue",
              "Help"
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => setInput(item)}
                className="px-3 py-2 text-xs font-medium rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative">

              <input
                value={input}
                type="text"
                placeholder="Ask ChainAI..."
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleSend()
                }
                className="w-full rounded-full border-2 border-slate-200 focus:border-indigo-500 outline-none px-5 py-4 pr-14 text-sm transition-all"
              />

              <button
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() =>
          setIsOpen(!isOpen)
        }
        className="group px-6 py-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-[0_20px_50px_rgba(99,102,241,0.45)] flex items-center gap-3 hover:scale-105 transition-all"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </div>

        <span className="font-bold tracking-wide">
          AI Assistant
        </span>

        <Sparkles className="w-4 h-4 opacity-80 group-hover:rotate-12 transition-all" />
      </button>
    </div>
  );
};

export default Chatbot;
