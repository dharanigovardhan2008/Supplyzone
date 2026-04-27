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
  BarChart3,
  Layers3,
  ShoppingCart,
  Bot
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  query,
  limit,
  getDocs,
  orderBy
} from "firebase/firestore";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface Product {
  name: string;
  stock: number;
  reorder: number;
  category: string;
  price: number;
}

interface Bill {
  total: number;
  items: number;
  date: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "👋 Welcome to ChainAI.\nYour smart supply chain assistant is ready.\nAsk me about stock, sales, reorder items, analytics and business reports."
    }
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !dataLoaded) {
      fetchBusinessData();
    }
  }, [isOpen, dataLoaded]);

  const fetchBusinessData = async () => {
    try {
      const productSnap = await getDocs(
        query(collection(db, "products"), limit(100))
      );

      const productData: Product[] =
        productSnap.docs.map((doc) => {
          const data = doc.data();

          return {
            name: data.name || "Unknown Product",
            stock: data.current_stock || 0,
            reorder: data.reorder_point || 0,
            category: data.category || "General",
            price: data.price || 0
          };
        });

      const billSnap = await getDocs(
        query(
          collection(db, "bills"),
          orderBy("created_at", "desc"),
          limit(50)
        )
      );

      const billData: Bill[] = billSnap.docs.map(
        (doc) => {
          const data = doc.data();

          return {
            total: data.grand_total || 0,
            items: data.items?.length || 0,
            date:
              data.created_at
                ?.toDate?.()
                ?.toLocaleDateString() ||
              new Date().toLocaleDateString()
          };
        }
      );

      setProducts(productData);
      setBills(billData);
      setDataLoaded(true);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setBills([]);
      setDataLoaded(true);
    }
  };

  const generateResponse = (
    userInput: string
  ): string => {
    const text = userInput.toLowerCase();

    const totalRevenue = bills.reduce(
      (sum, b) => sum + b.total,
      0
    );

    const avgBill =
      bills.length > 0
        ? totalRevenue / bills.length
        : 0;

    const lowStock = products.filter(
      (p) => p.stock <= p.reorder
    );

    const totalUnits = products.reduce(
      (sum, p) => sum + p.stock,
      0
    );

    if (
      text.includes("hi") ||
      text.includes("hello") ||
      text.includes("hey")
    ) {
      return "👋 Hello! I'm ChainAI.\nHow can I help your business today?";
    }

    if (
      text.includes("help") ||
      text.includes("what can you do")
    ) {
      return `🤖 I can help with:

📦 Inventory
• Check stock
• Low stock alerts
• Reorder suggestions

💰 Sales
• Total revenue
• Today's sales
• Average bill value

📊 Reports
• Product analytics
• Category summary
• Best sellers

Try asking:
• Show stock report
• Today's revenue
• Low stock items
• Best selling products`;
    }

    if (
      text.includes("stock") ||
      text.includes("inventory")
    ) {
      return `📦 Inventory Report

• Products: ${products.length}
• Total Units: ${totalUnits}
• Low Stock Items: ${lowStock.length}

${
  lowStock.length > 0
    ? "⚠️ Some products need reorder."
    : "✅ Inventory healthy."
}`;
    }

    if (
      text.includes("low stock") ||
      text.includes("reorder") ||
      text.includes("need order")
    ) {
      if (lowStock.length === 0) {
        return "✅ No low stock items currently.";
      }

      return `⚠️ Low Stock Items

${lowStock
  .slice(0, 10)
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
Current: ${p.stock}
Reorder Level: ${p.reorder}`
  )
  .join("\n\n")}`;
    }

    if (
      text.includes("sales") ||
      text.includes("revenue")
    ) {
      return `💰 Sales Summary

• Total Revenue: ₹${totalRevenue.toFixed(2)}
• Total Bills: ${bills.length}
• Average Bill: ₹${avgBill.toFixed(2)}`;
    }

    if (
      text.includes("today")
    ) {
      const today =
        new Date().toLocaleDateString();

      const todayBills = bills.filter(
        (b) => b.date === today
      );

      const todayRevenue =
        todayBills.reduce(
          (sum, b) => sum + b.total,
          0
        );

      return `📅 Today's Report

• Bills: ${todayBills.length}
• Revenue: ₹${todayRevenue.toFixed(
        2
      )}`;
    }

    if (
      text.includes("best") ||
      text.includes("top") ||
      text.includes("popular")
    ) {
      const topProducts = [...products]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      return `🏆 Best Selling Products

${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
Category: ${p.category}`
  )
  .join("\n\n")}`;
    }

    if (
      text.includes("category")
    ) {
      const categories = [
        ...new Set(
          products.map(
            (p) => p.category
          )
        )
      ];

      return `📂 Categories

${categories
  .map((c) => `• ${c}`)
  .join("\n")}`;
    }

    if (
      text.includes("analytics") ||
      text.includes("report")
    ) {
      return `📊 Business Analytics

• Products: ${products.length}
• Revenue: ₹${totalRevenue.toFixed(
        2
      )}
• Low Stock: ${lowStock.length}
• Avg Bill: ₹${avgBill.toFixed(2)}

📈 Performance looks ${
        totalRevenue > 0
          ? "good"
          : "inactive"
      }.`;
    }

    if (
      text.includes("thanks") ||
      text.includes("thank you")
    ) {
      return "😊 You're welcome!";
    }

    return `🤖 I understood: "${userInput}"

Try asking:
• Stock report
• Revenue summary
• Low stock items
• Top products
• Analytics`;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;

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
      const reply =
        generateResponse(msg);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: reply
        }
      ]);

      setLoading(false);
    }, 800);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content:
          "👋 Welcome back to ChainAI.\nHow can I help you today?"
      }
    ]);
  };

  const suggestions = [
    {
      text: "Stock report",
      icon: Package
    },
    {
      text: "Today's revenue",
      icon: DollarSign
    },
    {
      text: "Low stock items",
      icon: AlertCircle
    },
    {
      text: "Best selling products",
      icon: TrendingUp
    },
    {
      text: "Analytics report",
      icon: BarChart3
    },
    {
      text: "Categories",
      icon: Layers3
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[390px] h-[560px] bg-white rounded-[32px] shadow-2xl shadow-indigo-200 border border-indigo-100 overflow-hidden mb-5 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="text-white w-6 h-6" />
              </div>

              <div>
                <h3 className="text-white font-bold">
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

          {/* Chat */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-5 space-y-4"
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
                  className={`max-w-[82%] whitespace-pre-line text-sm leading-relaxed px-4 py-3 rounded-3xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
                      : "bg-white shadow-md border border-slate-100 text-slate-700 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white w-fit px-4 py-3 rounded-3xl shadow">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map(
                  (item, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setInput(
                          item.text
                        )
                      }
                      className="px-3 py-2 text-xs rounded-full border bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center gap-1"
                    >
                      <item.icon className="w-3 h-3" />
                      {item.text}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={input}
                disabled={loading}
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
                className="w-full rounded-full border-2 border-slate-200 focus:border-indigo-500 outline-none px-5 py-4 pr-14 text-sm"
              />

              <button
                onClick={handleSend}
                disabled={
                  loading ||
                  !input.trim()
                }
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
      </button>
    </div>
  );
};

export default Chatbot;
