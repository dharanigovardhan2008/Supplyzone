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
  AlertCircle 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { model } from '../gemini';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'Hello! I am your Smart Supply Chain Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchContext = async () => {
    // Get latest data for Gemini context
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(query(productsRef, limit(50)));
    const products = productsSnap.docs.map(doc => ({
      name: doc.data().name,
      stock: doc.data().current_stock,
      reorder: doc.data().reorder_point,
      category: doc.data().category
    }));

    const billsRef = collection(db, 'bills');
    const billsSnap = await getDocs(query(billsRef, orderBy('created_at', 'desc'), limit(10)));
    const bills = billsSnap.docs.map(doc => ({
      total: doc.data().grand_total,
      items: doc.data().items.length
    }));

    return `
      Current Business Data:
      Inventory: ${JSON.stringify(products)}
      Recent Sales: ${JSON.stringify(bills)}
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const context = await fetchContext();
      
      // Using startChat for a better conversational experience
      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })).slice(-6), // Keep last 6 messages for context
      });

      const prompt = `
        Context Data: ${context}
        User Query: ${userMsg}
        
        System Rules:
        - You are the ChainAI assistant.
        - Use specific numbers from the context (e.g. "We have 12 MacBooks").
        - If today's revenue is asked, check the recent bills in context.
        - Be friendly but professional.
      `;

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();
      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
    } catch (err: any) {
      console.error("Gemini Error Detail:", err);
      let errorMsg = "I'm having trouble processing that right now.";
      if (err.message?.includes('API key')) errorMsg = "AI API Key issue. Please check configuration.";
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: "Check stock levels", icon: Package },
    { text: "Today's revenue", icon: DollarSign },
    { text: "What to reorder?", icon: Sparkles },
    { text: "Best selling product", icon: TrendingUp }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white rounded-[32px] shadow-2xl shadow-indigo-200 border border-indigo-50 flex flex-col overflow-hidden mb-6 animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-indigo-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold leading-none">ChainAI Assistant</h3>
                <p className="text-white/70 text-[10px] mt-1 uppercase tracking-wider font-bold">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
                <Minus className="w-5 h-5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-[24px] text-sm font-medium ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-4 rounded-[24px] rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    <s.icon className="w-3 h-3" />
                    {s.text}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="w-full pl-6 pr-14 py-4 bg-white border-transparent focus:ring-4 focus:ring-indigo-100 rounded-[50px] outline-none shadow-sm font-medium text-sm"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[50px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-indigo-600 rounded-full animate-pulse"></div>
        </div>
        <span className="font-bold tracking-tight">AI Assistant</span>
      </button>
    </div>
  );
};

export default Chatbot;
