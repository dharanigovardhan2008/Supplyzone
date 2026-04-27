import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

interface Message {
  role: 'user' | 'ai';
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

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'Hello! I am your Smart Supply Chain Assistant. How can I help you today?'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !dataLoaded) {
      fetchBusinessData();
    }
  }, [isOpen, dataLoaded]);

  const fetchBusinessData = async () => {
    try {
      const productsRef = collection(db, 'products');

      const productsSnap = await getDocs(
        query(productsRef, limit(50))
      );

      const productsData: Product[] = productsSnap.docs.map((doc) => {
        const data = doc.data();

        return {
          name: data.name || 'Unknown Product',
          stock: data.current_stock || 0,
          reorder: data.reorder_point || 0,
          category: data.category || 'General',
          price: data.price || 0
        };
      });

      const billsRef = collection(db, 'bills');

      const billsSnap = await getDocs(
        query(
          billsRef,
          orderBy('created_at', 'desc'),
          limit(20)
        )
      );

      const billsData: Bill[] = billsSnap.docs.map((doc) => {
        const data = doc.data();

        return {
          total: data.grand_total || 0,
          items: data.items?.length || 0,
          date:
            data.created_at?.toDate?.()?.toLocaleDateString() ||
            new Date().toLocaleDateString()
        };
      });

      setProducts(productsData);
      setBills(billsData);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);

      setProducts([]);
      setBills([]);
      setDataLoaded(true);
    }
  };

  const generateResponse = (userInput: string): string => {
    const text = userInput.toLowerCase();

    if (text.includes('stock') || text.includes('inventory')) {
      if (products.length === 0) {
        return '📦 No inventory data available yet.';
      }

      const lowStock = products.filter(
        (p) => p.stock <= p.reorder
      );

      const totalStock = products.reduce(
        (sum, p) => sum + p.stock,
        0
      );

      return `📦 Inventory Overview

• Total Products: ${products.length}
• Total Units: ${totalStock}
• Low Stock Items: ${lowStock.length}`;
    }

    if (
      text.includes('revenue') ||
      text.includes('sales') ||
      text.includes('earning')
    ) {
      if (bills.length === 0) {
        return '💰 No sales data available yet.';
      }

      const totalRevenue = bills.reduce(
        (sum, b) => sum + b.total,
        0
      );

      const avgBill = totalRevenue / bills.length;

      return `💰 Sales Summary

• Total Revenue: ₹${totalRevenue.toFixed(2)}
• Total Bills: ${bills.length}
• Average Bill: ₹${avgBill.toFixed(2)}`;
    }

    if (
      text.includes('reorder') ||
      text.includes('order')
    ) {
      const lowStock = products.filter(
        (p) => p.stock <= p.reorder
      );

      if (lowStock.length === 0) {
        return '✅ No reorder needed now.';
      }

      return `📋 Reorder Items

${lowStock
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} (${p.stock} left)`
  )
  .join('\n')}`;
    }

    if (
      text.includes('best') ||
      text.includes('popular') ||
      text.includes('top')
    ) {
      const topProducts = [...products]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      return `🏆 Top Products

${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} - ${p.category}`
  )
  .join('\n')}`;
    }

    if (
      text.includes('help') ||
      text.includes('what can you do')
    ) {
      return `🤖 I can help with:

• Stock levels
• Revenue reports
• Reorder suggestions
• Product insights

Try:
• Check stock
• Today's revenue
• What to reorder`;
    }

    if (
      text.includes('hi') ||
      text.includes('hello') ||
      text.includes('hey')
    ) {
      return '👋 Hello! How can I help you today?';
    }

    if (text.includes('thank')) {
      return '😊 You are welcome!';
    }

    return `I understand "${userInput}"

Try asking about:
• Stock
• Revenue
• Reorder
• Best products`;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg }
    ]);

    setInput('');
    setLoading(true);

    setTimeout(() => {
      const reply = generateResponse(userMsg);

      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: reply }
      ]);

      setLoading(false);
    }, 700);
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'ai',
        content:
          'Hello! I am your Smart Supply Chain Assistant. How can I help you today?'
      }
    ]);
  };

  const suggestions = [
    { text: 'Check stock levels', icon: Package },
    { text: "Today's revenue", icon: DollarSign },
    { text: 'What to reorder?', icon: AlertCircle },
    { text: 'Best selling products', icon: TrendingUp }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white rounded-[32px] shadow-2xl border flex flex-col overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-white w-6 h-6" />
              </div>

              <div>
                <h3 className="text-white font-bold">
                  ChainAI Assistant
                </h3>
                <p className="text-white/70 text-xs">
                  Smart Responses
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={resetChat}>
                <RefreshCw className="text-white w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
              >
                <Minus className="text-white w-5 h-5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
              >
                <X className="text-white w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-line text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white shadow'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-sm text-slate-500">
                Typing...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.text)}
                    className="px-3 py-2 text-xs rounded-full border"
                  >
                    <s.icon className="w-3 h-3 inline mr-1" />
                    {s.text}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                value={input}
                type="text"
                disabled={loading}
                placeholder="Ask anything..."
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSend()
                }
                className="w-full border rounded-full px-5 py-3 pr-12 outline-none"
              />

              <button
                onClick={handleSend}
                disabled={
                  loading || !input.trim()
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-3 shadow-xl"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-bold">
          AI Assistant
        </span>
      </button>
    </div>
  );
};

export default Chatbot;
