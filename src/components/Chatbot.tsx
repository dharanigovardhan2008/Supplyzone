import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, X, RefreshCw, Bot, Sparkles,
  Package, DollarSign, AlertCircle, TrendingUp,
  BarChart3, Layers3, ShoppingCart, BadgeIndianRupee,
  ChevronDown, Zap
} from "lucide-react";
import { db } from "../firebase";
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp?: Date;
}

interface Product {
  name: string;
  stock: number;
  reorder: number;
  category: string;
  price: number;
  cost_price: number;
  sku: string;
}

interface Bill {
  total: number;
  items: number;
  date: string;
  payment_method: string;
  customer_name: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hi! I'm ChainAI, your intelligent supply chain assistant. I have full access to your inventory, sales, and analytics data.\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !dataLoaded) fetchData();
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, dataLoaded]);

  const fetchData = async () => {
    try {
      const productSnap = await getDocs(query(collection(db, "products"), limit(200)));
      const productData: Product[] = productSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          name: d.name || "Unknown",
          stock: d.current_stock || 0,
          reorder: d.reorder_point || 0,
          category: d.category || "General",
          price: d.selling_price || 0,
          cost_price: d.cost_price || 0,
          sku: d.sku || "",
        };
      });

      const billSnap = await getDocs(
        query(collection(db, "bills"), orderBy("created_at", "desc"), limit(100))
      );
      const billData: Bill[] = billSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          total: d.grand_total || 0,
          items: d.items?.length || 0,
          date: d.created_at?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
          payment_method: d.payment_method || "Unknown",
          customer_name: d.customer_name || "Guest",
        };
      });

      setProducts(productData);
      setBills(billData);
      setDataLoaded(true);
    } catch (error) {
      console.error(error);
      setDataLoaded(true);
    }
  };

  const buildContext = () => {
    const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
    const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter((p) => p.stock <= p.reorder);
    const today = new Date().toLocaleDateString();
    const todayBills = bills.filter((b) => b.date === today);
    const todayRevenue = todayBills.reduce((s, b) => s + b.total, 0);
    const categories = [...new Set(products.map((p) => p.category))];
    const totalProfit = products.reduce((s, p) => s + (p.price - p.cost_price) * p.stock, 0);
    const topByPrice = [...products].sort((a, b) => b.price - a.price).slice(0, 10);
    const paymentBreakdown = bills.reduce((acc: any, b) => {
      acc[b.payment_method] = (acc[b.payment_method] || 0) + b.total;
      return acc;
    }, {});

    return `You are ChainAI, an expert AI assistant for SupplyChain AI — an inventory and POS management system.
You have LIVE access to the following real business data. Answer with precision, be concise but insightful.
Use ₹ for currency. Format numbers nicely. Be helpful and proactive.

=== INVENTORY DATA ===
Total Products: ${products.length}
Total Units in Stock: ${totalUnits}
Low Stock Items (${lowStock.length}): ${lowStock.map(p => `${p.name} (${p.stock} left, reorder at ${p.reorder})`).join(", ") || "None"}
Categories (${categories.length}): ${categories.join(", ")}
Top 10 by Price: ${topByPrice.map(p => `${p.name} ₹${p.price.toLocaleString('en-IN')}`).join(", ")}
Estimated Stock Value (potential profit): ₹${totalProfit.toLocaleString('en-IN')}

=== SALES DATA ===
Total Bills: ${bills.length}
Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
Average Bill Value: ₹${avgBill.toFixed(2)}
Today's Bills: ${todayBills.length}
Today's Revenue: ₹${todayRevenue.toLocaleString('en-IN')}
Payment Breakdown: ${Object.entries(paymentBreakdown).map(([k, v]: any) => `${k}: ₹${v.toLocaleString('en-IN')}`).join(", ") || "No data"}

=== ALL PRODUCTS ===
${products.map(p => `• ${p.name} | SKU: ${p.sku} | Category: ${p.category} | Stock: ${p.stock} | Price: ₹${p.price} | Cost: ₹${p.cost_price}`).join("\n")}

Keep responses brief, structured, and business-focused. Use bullet points for lists. Avoid unnecessary filler words.`;
  };

  const callClaudeAPI = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    const systemContext = buildContext();

    const apiMessages = conversationHistory
      .filter(m => m.role !== "ai" || conversationHistory.indexOf(m) > 0)
      .map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

    apiMessages.push({ role: "user", content: userMessage });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemContext,
        messages: apiMessages,
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.type === "text") {
      return data.content[0].text;
    }
    throw new Error("No response from API");
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");

    const userMessage: Message = { role: "user", content: msg, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);
    setIsTyping(true);

    try {
      const reply = await callClaudeAPI(msg, updatedMessages);
      setMessages(prev => [...prev, { role: "ai", content: reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "ai", content: "Sorry, I couldn't connect right now. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([{
      role: "ai",
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const quickActions = [
    { label: "Stock Summary", icon: Package, query: "Give me a full inventory summary" },
    { label: "Revenue", icon: DollarSign, query: "Show me total revenue and sales stats" },
    { label: "Low Stock", icon: AlertCircle, query: "Which products need restocking?" },
    { label: "Top Products", icon: TrendingUp, query: "What are the most expensive and valuable products?" },
    { label: "Analytics", icon: BarChart3, query: "Give me a full business performance report" },
    { label: "Categories", icon: Layers3, query: "Break down inventory by category" },
    { label: "Today", icon: ShoppingCart, query: "What's today's sales report?" },
    { label: "Profit Estimate", icon: BadgeIndianRupee, query: "What's my estimated profit margin?" },
  ];

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="flex flex-col bg-white rounded-[28px] overflow-hidden border border-slate-200/80"
          style={{
            width: "420px",
            height: isMinimized ? "72px" : "620px",
            boxShadow: "0 32px 80px rgba(79, 70, 229, 0.18), 0 8px 24px rgba(0,0,0,0.08)",
            transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm tracking-tight">ChainAI Assistant</h3>
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                    <Zap className="w-2.5 h-2.5 text-yellow-300" />
                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-wide">Claude</span>
                  </div>
                </div>
                <p className="text-white/60 text-[11px] mt-0.5">
                  {dataLoaded ? `${products.length} products · ${bills.length} bills loaded` : "Loading data..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                title="Clear chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}
              >
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm"
                      }`}
                      style={msg.role === "user" ? {
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      } : {}}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1.5 items-center h-4">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {messages.length <= 2 && (
                <div className="px-4 py-3 border-t border-slate-50 bg-white">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Quick Actions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(item.query);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 transition-all"
                      >
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white transition-all px-4 py-2.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    placeholder="Ask anything about your business..."
                    disabled={loading}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    style={{ background: loading || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-300 mt-2">Powered by Claude AI · Live business data</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-semibold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
          boxShadow: "0 8px 32px rgba(79, 70, 229, 0.4)",
        }}
      >
        {isOpen ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>AI Assistant</span>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </>
        )}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
