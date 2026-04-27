import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Sparkles,
  Bot,
  RefreshCw,
  Package,
  TrendingUp,
  DollarSign,
  AlertCircle,
  BarChart3,
  Layers3,
  ShoppingCart
} from "lucide-react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "👋 Welcome to ChainAI Assistant.\nAsk me about stock, revenue, sales, reorder, products, suppliers, analytics, categories and reports."
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const has = (
    text: string,
    words: string[]
  ) => words.some((w) => text.includes(w));

  const getReply = (msg: string) => {
    const text = msg.toLowerCase();

    /* Greetings */
    if (
      has(text, [
        "hi",
        "hello",
        "hey",
        "yo"
      ])
    )
      return "👋 Hello! Welcome back to ChainAI.";

    /* Help */
    if (
      has(text, [
        "help",
        "menu",
        "options",
        "what can you do"
      ])
    )
      return `🤖 I can help with:

📦 Inventory
💰 Revenue
📈 Sales
⚠️ Reorder
🏆 Best Products
📂 Categories
🚚 Suppliers
📊 Reports
📅 Daily Summary`;

    /* Stock */
    if (
      has(text, [
        "stock",
        "inventory",
        "items",
        "products"
      ])
    )
      return `📦 Inventory Status

• Total Products: 148
• In Stock: 132
• Low Stock: 16
• Out of Stock: 3`;

    /* Low stock */
    if (
      has(text, [
        "low stock",
        "reorder",
        "restock",
        "alert"
      ])
    )
      return `⚠️ Reorder Recommended:

1. Wireless Mouse
2. Keyboard
3. USB Cable
4. Printer Ink
5. Router`;

    /* Revenue */
    if (
      has(text, [
        "revenue",
        "income",
        "money",
        "earning"
      ])
    )
      return `💰 Revenue Summary

• Today: ₹12,450
• This Week: ₹86,200
• This Month: ₹3,48,900`;

    /* Sales */
    if (
      has(text, [
        "sales",
        "sold",
        "orders"
      ])
    )
      return `📈 Sales Performance

• Orders Today: 32
• Completed: 29
• Pending: 3
• Growth: +12%`;

    /* Profit */
    if (
      has(text, [
        "profit",
        "margin"
      ])
    )
      return `💵 Profit Overview

• Today Profit: ₹4,280
• Avg Margin: 28%
• Best Margin Product: Headphones`;

    /* Best products */
    if (
      has(text, [
        "top",
        "best",
        "popular",
        "selling"
      ])
    )
      return `🏆 Best Selling Products

1. Wireless Mouse
2. Smart Watch
3. Keyboard
4. Charger
5. Earbuds`;

    /* Categories */
    if (
      has(text, [
        "category",
        "categories",
        "types"
      ])
    )
      return `📂 Categories

• Electronics
• Accessories
• Networking
• Office
• Home Devices`;

    /* Suppliers */
    if (
      has(text, [
        "supplier",
        "vendors",
        "vendor"
      ])
    )
      return `🚚 Supplier Insights

• Active Suppliers: 12
• Best Supplier: TechSource Ltd
• Delayed Orders: 2`;

    /* Delivery */
    if (
      has(text, [
        "delivery",
        "shipment",
        "dispatch"
      ])
    )
      return `🚛 Delivery Status

• Dispatched Today: 18
• In Transit: 9
• Delivered: 24`;

    /* Customer */
    if (
      has(text, [
        "customer",
        "clients",
        "buyer"
      ])
    )
      return `👥 Customer Stats

• New Customers Today: 7
• Returning Customers: 19
• Satisfaction Score: 4.7/5`;

    /* Daily report */
    if (
      has(text, [
        "today",
        "daily",
        "summary"
      ])
    )
      return `📅 Today's Summary

• Revenue: ₹12,450
• Orders: 32
• Customers: 26
• Profit: ₹4,280`;

    /* Monthly */
    if (
      has(text, [
        "month",
        "monthly"
      ])
    )
      return `🗓️ Monthly Report

• Revenue: ₹3,48,900
• Orders: 821
• Profit: ₹96,400`;

    /* Analytics */
    if (
      has(text, [
        "analytics",
        "report",
        "performance",
        "stats"
      ])
    )
      return `📊 Analytics

• Growth Rate: +18%
• Avg Order Value: ₹1,420
• Best Category: Electronics
• Repeat Buyers: 61%`;

    /* Discount */
    if (
      has(text, [
        "discount",
        "offer",
        "sale offer"
      ])
    )
      return `🎁 Promotions

• Running Offers: 3
• Best Offer: Buy 2 Get 1
• Highest Conversion: 14%`;

    /* Expense */
    if (
      has(text, [
        "expense",
        "cost",
        "spending"
      ])
    )
      return `💸 Expense Summary

• Inventory Purchase: ₹1,20,000
• Logistics: ₹22,000
• Utilities: ₹8,400`;

    /* Out of stock */
    if (
      has(text, [
        "out of stock",
        "unavailable"
      ])
    )
      return `❌ Out of Stock

1. HDMI Cable
2. Laptop Stand
3. SSD 1TB`;

    /* Thanks */
    if (
      has(text, [
        "thanks",
        "thank you",
        "ok"
      ])
    )
      return "😊 You're welcome!";

    return `🤖 I understood "${msg}"

Try asking:
• stock
• revenue
• sales
• profit
• reorder
• suppliers
• monthly report
• analytics`;
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
          content: getReply(msg)
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
          "👋 Welcome back to ChainAI.\nAsk me anything."
      }
    ]);
  };

  const quick = [
    {
      text: "Stock",
      icon: Package
    },
    {
      text: "Revenue",
      icon: DollarSign
    },
    {
      text: "Sales",
      icon: TrendingUp
    },
    {
      text: "Reorder",
      icon: AlertCircle
    },
    {
      text: "Analytics",
      icon: BarChart3
    },
    {
      text: "Categories",
      icon: Layers3
    },
    {
      text: "Orders",
      icon: ShoppingCart
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">

      {isOpen && (
        <div className="w-[430px] h-[660px] bg-white rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden mb-5 flex flex-col">

          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex justify-between items-center">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-white font-bold text-lg">
                  ChainAI
                </h3>
                <p className="text-white/70 text-xs">
                  Business Assistant
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetChat}
                className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-slate-50 to-white space-y-4"
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
                      : "bg-white shadow border text-slate-700 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white px-4 py-3 rounded-3xl shadow border w-fit">
                Typing...
              </div>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-white border-t">
            {quick.map((item, i) => (
              <button
                key={i}
                onClick={() =>
                  setInput(item.text)
                }
                className="px-3 py-2 rounded-full bg-slate-100 hover:bg-indigo-50 text-xs flex items-center gap-1"
              >
                <item.icon className="w-3 h-3" />
                {item.text}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
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
                className="w-full px-5 py-4 pr-14 rounded-full border-2 border-slate-200 focus:border-indigo-500 outline-none text-sm"
              />

              <button
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center"
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
        className="px-6 py-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-bold">
          AI Assistant
        </span>
        <Sparkles className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Chatbot;
