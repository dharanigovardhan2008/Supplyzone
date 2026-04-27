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
  BadgeIndianRupee
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
        "👋 Welcome to ChainAI Assistant.\nAsk me about stock, revenue, products, reorder, analytics, categories, sales, profit and reports."
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
      fetchData();
    }
  }, [isOpen, dataLoaded]);

  const fetchData = async () => {
    try {
      const productSnap = await getDocs(
        query(collection(db, "products"), limit(100))
      );

      const productData: Product[] =
        productSnap.docs.map((doc) => {
          const data = doc.data();

          return {
            name: data.name || "Unknown",
            stock: data.current_stock || 0,
            reorder: data.reorder_point || 0,
            category: data.category || "General",
            price: data.selling_price || 0
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
      setDataLoaded(true);
    }
  };

  const includesAny = (
    text: string,
    arr: string[]
  ) => arr.some((word) => text.includes(word));

  const generateResponse = (
    userInput: string
  ): string => {
    const text = userInput.toLowerCase().trim();

    const totalRevenue = bills.reduce(
      (sum, b) => sum + b.total,
      0
    );

    const avgBill =
      bills.length > 0
        ? totalRevenue / bills.length
        : 0;

    const totalUnits = products.reduce(
      (sum, p) => sum + p.stock,
      0
    );

    const lowStock = products.filter(
      (p) => p.stock <= p.reorder
    );

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

    // greetings
    if (
      includesAny(text, [
        "hi",
        "hello",
        "hey",
        "yo"
      ])
    ) {
      return "👋 Hello! I'm ChainAI. How can I help your business today?";
    }

    // help
    if (
      includesAny(text, [
        "help",
        "what",
        "menu",
        "options"
      ])
    ) {
      return `🤖 I can help with:

📦 Stock / Inventory
💰 Revenue / Sales
📈 Analytics
⚠️ Reorder Items
🏆 Top Products
📂 Categories
📅 Today's Report

Try asking:
• stock
• revenue
• reorder
• top products
• analytics`;
    }

    // stock
    if (
      includesAny(text, [
        "stock",
        "inventory",
        "items"
      ])
    ) {
      return `📦 Inventory Summary

• Products: ${products.length}
• Total Units: ${totalUnits}
• Low Stock: ${lowStock.length}

${
  lowStock.length > 0
    ? "⚠️ Some items need restock."
    : "✅ Inventory healthy."
}`;
    }

    // low stock
    if (
      includesAny(text, [
        "low",
        "reorder",
        "restock",
        "alert"
      ])
    ) {
      if (lowStock.length === 0) {
        return "✅ No low stock products right now.";
      }

      return `⚠️ Low Stock Products

${lowStock
  .slice(0, 8)
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
Stock: ${p.stock}
Reorder: ${p.reorder}`
  )
  .join("\n\n")}`;
    }

    // sales revenue
    if (
      includesAny(text, [
        "sale",
        "sales",
        "revenue",
        "money",
        "income",
        "earning"
      ])
    ) {
      return `💰 Sales Summary

• Total Revenue: ₹${totalRevenue.toFixed(
        2
      )}
• Bills: ${bills.length}
• Avg Bill: ₹${avgBill.toFixed(2)}`;
    }

    // today
    if (
      includesAny(text, [
        "today",
        "daily",
        "now"
      ])
    ) {
      return `📅 Today's Report

• Transactions: ${todayBills.length}
• Revenue: ₹${todayRevenue.toFixed(
        2
      )}`;
    }

    // top products
    if (
      includesAny(text, [
        "top",
        "best",
        "popular",
        "selling"
      ])
    ) {
      const topProducts = [...products]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      return `🏆 Top Products

${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
${p.category}`
  )
  .join("\n\n")}`;
    }

    // category
    if (
      includesAny(text, [
        "category",
        "categories",
        "types"
      ])
    ) {
      const cats = [
        ...new Set(
          products.map(
            (p) => p.category
          )
        )
      ];

      return `📂 Categories

${cats
  .map((c) => `• ${c}`)
  .join("\n")}`;
    }

    // price
    if (
      includesAny(text, [
        "price",
        "cost",
        "rate"
      ])
    ) {
      const expensive = [...products]
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);

      return `💵 Highest Price Products

${expensive
  .map(
    (p) =>
      `• ${p.name} - ₹${p.price}`
  )
  .join("\n")}`;
    }

    // analytics
    if (
      includesAny(text, [
        "analytics",
        "report",
        "summary",
        "performance",
        "business"
      ])
    ) {
      return `📊 Business Analytics

• Products: ${products.length}
• Revenue: ₹${totalRevenue.toFixed(
        2
      )}
• Avg Bill: ₹${avgBill.toFixed(2)}
• Low Stock: ${lowStock.length}

${
  totalRevenue > 0
    ? "📈 Business Active"
    : "📉 No Sales Yet"
}`;
    }

    // thanks
    if (
      includesAny(text, [
        "thanks",
        "thank",
        "ok"
      ])
    ) {
      return "😊 You're welcome!";
    }

    // default smart prediction
    return `🤖 I understood: "${userInput}"

Try asking:

• stock
• revenue
• low stock
• today's sales
• top products
• categories
• analytics`;
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
    }, 700);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content:
          "👋 Welcome back to ChainAI.\nHow can I help you?"
      }
    ]);
  };

  const suggestions = [
    {
      text: "Stock",
      icon: Package
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
      text: "Top Products",
      icon: TrendingUp
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
      text: "Today",
      icon: ShoppingCart
    },
    {
      text: "Price",
      icon: BadgeIndianRupee
    }
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
                  Smart Supply Chatbot
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
                      : "bg-white shadow border rounded-bl-md text-slate-700"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white px-4 py-3 rounded-3xl shadow w-fit">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2">
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

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="relative">
              <input
                type="text"
                value={input}
                placeholder="Ask ChainAI..."
                disabled={loading}
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

export default Chatbot;import React, { useState, useEffect, useRef } from "react";
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
  BadgeIndianRupee
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
        "👋 Welcome to ChainAI Assistant.\nAsk me about stock, revenue, products, reorder, analytics, categories, sales, profit and reports."
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
      fetchData();
    }
  }, [isOpen, dataLoaded]);

  const fetchData = async () => {
    try {
      const productSnap = await getDocs(
        query(collection(db, "products"), limit(100))
      );

      const productData: Product[] =
        productSnap.docs.map((doc) => {
          const data = doc.data();

          return {
            name: data.name || "Unknown",
            stock: data.current_stock || 0,
            reorder: data.reorder_point || 0,
            category: data.category || "General",
            price: data.selling_price || 0
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
      setDataLoaded(true);
    }
  };

  const includesAny = (
    text: string,
    arr: string[]
  ) => arr.some((word) => text.includes(word));

  const generateResponse = (
    userInput: string
  ): string => {
    const text = userInput.toLowerCase().trim();

    const totalRevenue = bills.reduce(
      (sum, b) => sum + b.total,
      0
    );

    const avgBill =
      bills.length > 0
        ? totalRevenue / bills.length
        : 0;

    const totalUnits = products.reduce(
      (sum, p) => sum + p.stock,
      0
    );

    const lowStock = products.filter(
      (p) => p.stock <= p.reorder
    );

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

    // greetings
    if (
      includesAny(text, [
        "hi",
        "hello",
        "hey",
        "yo"
      ])
    ) {
      return "👋 Hello! I'm ChainAI. How can I help your business today?";
    }

    // help
    if (
      includesAny(text, [
        "help",
        "what",
        "menu",
        "options"
      ])
    ) {
      return `🤖 I can help with:

📦 Stock / Inventory
💰 Revenue / Sales
📈 Analytics
⚠️ Reorder Items
🏆 Top Products
📂 Categories
📅 Today's Report

Try asking:
• stock
• revenue
• reorder
• top products
• analytics`;
    }

    // stock
    if (
      includesAny(text, [
        "stock",
        "inventory",
        "items"
      ])
    ) {
      return `📦 Inventory Summary

• Products: ${products.length}
• Total Units: ${totalUnits}
• Low Stock: ${lowStock.length}

${
  lowStock.length > 0
    ? "⚠️ Some items need restock."
    : "✅ Inventory healthy."
}`;
    }

    // low stock
    if (
      includesAny(text, [
        "low",
        "reorder",
        "restock",
        "alert"
      ])
    ) {
      if (lowStock.length === 0) {
        return "✅ No low stock products right now.";
      }

      return `⚠️ Low Stock Products

${lowStock
  .slice(0, 8)
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
Stock: ${p.stock}
Reorder: ${p.reorder}`
  )
  .join("\n\n")}`;
    }

    // sales revenue
    if (
      includesAny(text, [
        "sale",
        "sales",
        "revenue",
        "money",
        "income",
        "earning"
      ])
    ) {
      return `💰 Sales Summary

• Total Revenue: ₹${totalRevenue.toFixed(
        2
      )}
• Bills: ${bills.length}
• Avg Bill: ₹${avgBill.toFixed(2)}`;
    }

    // today
    if (
      includesAny(text, [
        "today",
        "daily",
        "now"
      ])
    ) {
      return `📅 Today's Report

• Transactions: ${todayBills.length}
• Revenue: ₹${todayRevenue.toFixed(
        2
      )}`;
    }

    // top products
    if (
      includesAny(text, [
        "top",
        "best",
        "popular",
        "selling"
      ])
    ) {
      const topProducts = [...products]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      return `🏆 Top Products

${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
${p.category}`
  )
  .join("\n\n")}`;
    }

    // category
    if (
      includesAny(text, [
        "category",
        "categories",
        "types"
      ])
    ) {
      const cats = [
        ...new Set(
          products.map(
            (p) => p.category
          )
        )
      ];

      return `📂 Categories

${cats
  .map((c) => `• ${c}`)
  .join("\n")}`;
    }

    // price
    if (
      includesAny(text, [
        "price",
        "cost",
        "rate"
      ])
    ) {
      const expensive = [...products]
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);

      return `💵 Highest Price Products

${expensive
  .map(
    (p) =>
      `• ${p.name} - ₹${p.price}`
  )
  .join("\n")}`;
    }

    // analytics
    if (
      includesAny(text, [
        "analytics",
        "report",
        "summary",
        "performance",
        "business"
      ])
    ) {
      return `📊 Business Analytics

• Products: ${products.length}
• Revenue: ₹${totalRevenue.toFixed(
        2
      )}
• Avg Bill: ₹${avgBill.toFixed(2)}
• Low Stock: ${lowStock.length}

${
  totalRevenue > 0
    ? "📈 Business Active"
    : "📉 No Sales Yet"
}`;
    }

    // thanks
    if (
      includesAny(text, [
        "thanks",
        "thank",
        "ok"
      ])
    ) {
      return "😊 You're welcome!";
    }

    // default smart prediction
    return `🤖 I understood: "${userInput}"

Try asking:

• stock
• revenue
• low stock
• today's sales
• top products
• categories
• analytics`;
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
    }, 700);
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content:
          "👋 Welcome back to ChainAI.\nHow can I help you?"
      }
    ]);
  };

  const suggestions = [
    {
      text: "Stock",
      icon: Package
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
      text: "Top Products",
      icon: TrendingUp
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
      text: "Today",
      icon: ShoppingCart
    },
    {
      text: "Price",
      icon: BadgeIndianRupee
    }
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
                  Smart Supply Chatbot
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
                      : "bg-white shadow border rounded-bl-md text-slate-700"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white px-4 py-3 rounded-3xl shadow w-fit">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2">
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

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="relative">
              <input
                type="text"
                value={input}
                placeholder="Ask ChainAI..."
                disabled={loading}
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
export default Chatbot;
