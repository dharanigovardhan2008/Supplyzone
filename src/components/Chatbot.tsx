import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  RefreshCw,
  Bot,
  Sparkles,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  BarChart3
} from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "👋 Hi! I'm ChainAI Assistant.\nAsk me about stock, revenue, sales or reports."
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const match = (
    text: string,
    words: string[]
  ) => words.some((word) => text.includes(word));

  const getReply = (
    msg: string
  ): string => {
    const text = msg.toLowerCase();

    if (
      match(text, [
        "hi",
        "hello",
        "hey"
      ])
    )
      return "👋 Hello! How can I help you today?";

    if (
      match(text, [
        "stock",
        "inventory"
      ])
    )
      return `📦 Inventory Report

• Total Products: 148
• Low Stock: 12
• Out of Stock: 3

Stock is healthy overall.`;

    if (
      match(text, [
        "sales",
        "orders"
      ])
    )
      return `📈 Sales Report

• Orders Today: 32
• Completed: 29
• Pending: 3

Sales are performing well today.`;

    if (
      match(text, [
        "revenue",
        "income"
      ])
    )
      return `💰 Revenue Summary

• Today: ₹12,450
• This Week: ₹86,200
• This Month: ₹3,48,900`;

    if (
      match(text, [
        "profit",
        "margin"
      ])
    )
      return `💵 Profit Status

Margins are stable.
Best category: Accessories.`;

    if (
      match(text, [
        "reorder",
        "low stock"
      ])
    )
      return `⚠️ Reorder Suggested

1. Keyboard
2. Mouse
3. USB Cable
4. Charger`;

    if (
      match(text, [
        "top",
        "best",
        "popular"
      ])
    )
      return `🏆 Top Products

1. Wireless Mouse
2. Earbuds
3. Smart Watch`;

    if (
      match(text, [
        "report",
        "analytics"
      ])
    )
      return `📊 Business Report

• Revenue Growth: +18%
• Avg Order Value: ₹1,420
• Returning Customers: 61%`;

    if (
      match(text, [
        "today"
      ])
    )
      return `📅 Today Summary

• Orders: 32
• Revenue: ₹12,450
• Customers: 26`;

    if (
      match(text, [
        "help"
      ])
    )
      return `🤖 I can help with:

• Stock
• Sales
• Revenue
• Reorder
• Reports`;

    if (
      match(text, [
        "thanks",
        "thank"
      ])
    )
      return "😊 You're welcome!";

    return "🤖 Ask me about stock, sales, revenue or reports.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const msg = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: msg
      }
    ]);

    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: getReply(msg)
        }
      ]);

      setLoading(false);
    }, 600);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content:
          "👋 Hi! I'm ChainAI Assistant.\nAsk me about stock, revenue, sales or reports."
      }
    ]);
  };

  const suggestions = [
    {
      text: "Stock",
      icon: Package
    },
    {
      text: "Sales",
      icon: TrendingUp
    },
    {
      text: "Revenue",
      icon: DollarSign
    },
    {
      text: "Low Stock",
      icon: AlertCircle
    },
    {
      text: "Report",
      icon: BarChart3
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">

      {isOpen && (
        <div className="w-[390px] h-[590px] bg-white rounded-[34px] shadow-2xl border border-slate-100 overflow-hidden mb-5 flex flex-col">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-4 flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-white font-bold">
                  ChainAI
                </h3>
                <p className="text-white/70 text-xs">
                  Smart Assistant
                </p>
              </div>
            </div>

            <div className="flex gap-2">

              <button
                onClick={resetChat}
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-5 bg-gradient-to-b from-slate-50 to-white space-y-3"
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
                  className={`max-w-[82%] px-4 py-3 rounded-3xl text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
                      : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-3xl w-fit">
                Typing...
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-white border-t border-slate-100">
            {suggestions.map((item, i) => (
              <button
                key={i}
                onClick={() =>
                  setInput(item.text)
                }
                className="px-3 py-2 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs flex items-center gap-1"
              >
                <item.icon className="w-3 h-3" />
                {item.text}
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
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleSend()
                }
                className="w-full h-12 rounded-full border-2 border-slate-200 focus:border-indigo-500 outline-none px-5 pr-14 text-sm"
              />

              <button
                onClick={handleSend}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center"
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
        className="px-6 h-14 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </div>

        <span className="font-bold">
          AI Assistant
        </span>

        <Sparkles className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Chatbot;
