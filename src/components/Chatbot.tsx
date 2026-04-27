import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Sparkles,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Bot,
  ShoppingCart,
  BarChart3,
  Layers3,
  BadgeIndianRupee,
  Truck,
  Users,
  ClipboardList
} from "lucide-react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "👋 Welcome to ChainAI Assistant.\nI can help you with inventory, revenue, sales, suppliers, reorder planning, reports and analytics.\nWhat would you like to know today?"
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

    if (
      has(text, [
        "hi",
        "hello",
        "hey"
      ])
    ) {
      return "👋 Hello! Welcome back to ChainAI Assistant.\nI’m ready to help you with business insights, stock management and performance reports.";
    }

    if (
      has(text, [
        "stock",
        "inventory"
      ])
    ) {
      return `📦 Inventory Overview

Your inventory is currently in stable condition.

• Most products are available in stock
• A few items may reach reorder level soon
• No major shortage risk detected

Recommendation:
Review fast-moving products and refill early to avoid sales loss.`;
    }

    if (
      has(text, [
        "revenue",
        "income",
        "money"
      ])
    ) {
      return `💰 Revenue Summary

Your revenue trend appears positive.

• Daily collections are steady
• Weekly growth is healthy
• Average billing value is improving

Recommendation:
Focus on premium products and combo offers to increase revenue further.`;
    }

    if (
      has(text, [
        "sales",
        "orders"
      ])
    ) {
      return `📈 Sales Performance

Sales activity is active and consistent.

• Orders are being generated regularly
• Repeat customer purchases are visible
• Product movement is healthy

Recommendation:
Promote top-selling products to boost conversions.`;
    }

    if (
      has(text, [
        "profit",
        "margin"
      ])
    ) {
      return `💵 Profit Analysis

Profit margins are moderate.

• High-margin accessories perform well
• Core products bring steady volume
• Bundled sales can improve margin

Recommendation:
Push profitable categories in your marketing campaigns.`;
    }

    if (
      has(text, [
        "top",
        "best",
        "popular"
      ])
    ) {
      return `🏆 Top Performing Products

These products are attracting strong demand:

1. Wireless Mouse
2. Smart Watch
3. Earbuds
4. Keyboard
5. Mobile Charger

Recommendation:
Keep extra stock for these items and feature them on homepage banners.`;
    }

    if (
      has(text, [
        "supplier",
        "vendor"
      ])
    ) {
      return `🚚 Supplier Report

Your supplier network is functioning normally.

• Most deliveries are on time
• A few delayed shipments may need follow-up
• Existing suppliers are reliable

Recommendation:
Maintain backup vendors for critical products.`;
    }

    if (
      has(text, [
        "customer",
        "buyer"
      ])
    ) {
      return `👥 Customer Insights

Customer engagement looks positive.

• Returning customers are increasing
• New visitors are converting
• Satisfaction trend is stable

Recommendation:
Launch loyalty rewards to improve repeat purchases.`;
    }

    if (
      has(text, [
        "category",
        "categories"
      ])
    ) {
      return `📂 Category Performance

Strong categories currently include:

• Electronics
• Accessories
• Smart Devices
• Office Products

Recommendation:
Focus promotions on the top two performing categories.`;
    }

    if (
      has(text, [
        "analytics",
        "report",
        "summary"
      ])
    ) {
      return `📊 Business Analytics

Overall business health is good.

• Revenue trend is positive
• Sales conversion is stable
• Inventory is under control
• Customer activity is healthy

Recommendation:
Continue tracking low-stock items and promote best sellers.`;
    }

    if (
      has(text, [
        "today",
        "daily"
      ])
    ) {
      return `📅 Today's Summary

Your business activity today looks steady.

• Multiple customer transactions completed
• Revenue collection is active
• Product movement is normal

Recommendation:
Push quick offers during peak hours for more orders.`;
    }

    if (
      has(text, [
        "month",
        "monthly"
      ])
    ) {
      return `🗓️ Monthly Overview

This month performance is balanced.

• Stable sales volume
• Positive customer retention
• Good revenue consistency

Recommendation:
Analyze weekends vs weekdays to optimize campaigns.`;
    }

    if (
      has(text, [
        "discount",
        "offer"
      ])
    ) {
      return `🎁 Offer Suggestions

Best offers for higher conversion:

• Buy 2 Get 1
• Flat 10% on accessories
• Combo electronics packs
• Weekend flash deals

Recommendation:
Use limited-time offers to create urgency.`;
    }

    if (
      has(text, [
        "help",
        "what can you do"
      ])
    ) {
      return `🤖 I can help with:

📦 Inventory Reports
💰 Revenue Insights
📈 Sales Analysis
🏆 Best Products
🚚 Supplier Updates
👥 Customer Trends
📊 Full Business Reports

Try asking:
• Stock report
• Revenue summary
• Best products
• Supplier status`;
    }

    if (
      has(text, [
        "thanks",
        "thank"
      ])
    ) {
      return "😊 You're welcome! I'm always here whenever you need business insights or quick reports.";
    }

    return `🤖 I understand your request: "${msg}"

I can help you with inventory, sales, revenue, suppliers, customer insights and reports.

Try asking:
• Stock report
• Revenue summary
• Top products
• Today's sales
• Supplier status`;
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
          "👋 Welcome back to ChainAI Assistant.\nHow can I help you today?"
      }
    ]);
  };

  const suggestions = [
    { text: "Stock Report", icon: Package },
    { text: "Revenue Summary", icon: DollarSign },
    { text: "Today's Sales", icon: ShoppingCart },
    { text: "Top Products", icon: TrendingUp },
    { text: "Analytics", icon: BarChart3 },
    { text: "Categories", icon: Layers3 },
    { text: "Supplier Status", icon: Truck },
    { text: "Customer Insights", icon: Users },
    { text: "Monthly Report", icon: ClipboardList },
    { text: "Offers", icon: BadgeIndianRupee },
    { text: "Low Stock Items", icon: AlertCircle }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[400px] h-[600px] bg-white rounded-[34px] shadow-2xl border border-slate-100 overflow-hidden mb-5 flex flex-col">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="font-bold text-white">
                  ChainAI Assistant
                </h3>
                <p className="text-white/70 text-xs">
                  Smart Business Helper
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetChat}
                className="text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="text-white"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setIsOpen(false)
                }
                className="text-white"
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

          {/* Suggestions */}
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-white border-t">
            {suggestions.map((item, i) => (
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
