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
    { role: 'ai', content: 'Hello! I am your Smart Supply Chain Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cache for business data
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load data when chatbot opens
  useEffect(() => {
    if (isOpen && !dataLoaded) {
      fetchBusinessData();
    }
  }, [isOpen]);

  const fetchBusinessData = async () => {
    try {
      // Fetch products
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(query(productsRef, limit(50)));
      
      const productsData = productsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name || 'Unknown Product',
          stock: data.current_stock || 0,
          reorder: data.reorder_point || 0,
          category: data.category || 'General',
          price: data.price || 0
        };
      });

      // Fetch bills
      const billsRef = collection(db, 'bills');
      const billsSnap = await getDocs(query(billsRef, orderBy('created_at', 'desc'), limit(20)));
      
      const billsData = billsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          total: data.grand_total || 0,
          items: data.items?.length || 0,
          date: data.created_at?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()
        };
      });

      setProducts(productsData);
      setBills(billsData);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set empty data on error
      setProducts([]);
      setBills([]);
      setDataLoaded(true;
    }
  };

  // Smart response generator based on keywords
  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // STOCK / INVENTORY QUERIES
    if (input.includes('stock') || input.includes('inventory')) {
      if (products.length === 0) {
        return "📦 No inventory data available yet. Please add products to your system.";
      }

      const lowStock = products.filter(p => p.stock <= p.reorder);
      const totalProducts = products.length;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

      if (input.includes('low') || input.includes('reorder')) {
        if (lowStock.length === 0) {
          return `✅ Great news! All ${totalProducts} products are well-stocked. No reordering needed right now.`;
        }
        return `⚠️ **Low Stock Alert!**\n\n${lowStock.slice(0, 5).map(p => 
          `• ${p.name}: Only ${p.stock} units left (Reorder at ${p.reorder})`
        ).join('\n')}\n\n${lowStock.length > 5 ? `...and ${lowStock.length - 5} more items need attention.` : ''}`;
      }

      return `📦 **Inventory Overview:**\n\n• Total Products: ${totalProducts}\n• Total Units: ${totalStock}\n• Low Stock Items: ${lowStock.length}\n\n${products.slice(0, 3).map(p => 
        `• ${p.name}: ${p.stock} units ${p.stock <= p.reorder ? '⚠️' : '✅'}`
      ).join('\n')}`;
    }

    // REVENUE / SALES QUERIES
    if (input.includes('revenue') || input.includes('sales') || input.includes('earning')) {
      if (bills.length === 0) {
        return "💰 No sales data available yet. Start making sales to see revenue insights!";
      }

      const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
      const avgBill = totalRevenue / bills.length;

      // Today's revenue
      const today = new Date().toLocaleDateString();
      const todayBills = bills.filter(b => b.date === today);
      const todayRevenue = todayBills.reduce((sum, b) => sum + b.total, 0);

      if (input.includes('today')) {
        return `💰 **Today's Revenue (${today}):**\n\n• Total Sales: ₹${todayRevenue.toFixed(2)}\n• Transactions: ${todayBills.length}\n• Average Bill: ₹${todayBills.length ? (todayRevenue / todayBills.length).toFixed(2) : 0}`;
      }

      return `💰 **Sales Summary:**\n\n• Total Revenue: ₹${totalRevenue.toFixed(2)}\n• Total Bills: ${bills.length}\n• Average Bill Value: ₹${avgBill.toFixed(2)}\n\n📊 Recent transaction: ₹${bills[0]?.total.toFixed(2) || 0}`;
    }

    // REORDER RECOMMENDATIONS
    if (input.includes('reorder') || input.includes('order')) {
      const lowStock = products.filter(p => p.stock <= p.reorder);
      
      if (lowStock.length === 0) {
        return "✅ All products are sufficiently stocked. No reordering needed at this time!";
      }

      return `📋 **Reorder Recommendations:**\n\n${lowStock.slice(0, 7).map((p, i) => 
        `${i + 1}. ${p.name}\n   Current: ${p.stock} | Should be: ${p.reorder}+\n   Suggested order: ${Math.max(p.reorder * 2 - p.stock, 10)} units`
      ).join('\n\n')}${lowStock.length > 7 ? `\n\n...and ${lowStock.length - 7} more items` : ''}`;
    }

    // BEST SELLING / POPULAR
    if (input.includes('best') || input.includes('popular') || input.includes('top')) {
      if (products.length === 0) {
        return "📊 No product data available to analyze best sellers.";
      }

      // Sort by stock movement (lower stock = more sold)
      const topProducts = [...products].sort((a, b) => a.stock - b.stock).slice(0, 5);
      
      return `🏆 **Top Products:**\n\n${topProducts.map((p, i) => 
        `${i + 1}. ${p.name}\n   Current Stock: ${p.stock} units\n   Category: ${p.category}`
      ).join('\n\n')}`;
    }

    // CATEGORIES
    if (input.includes('category') || input.includes('categories')) {
      if (products.length === 0) {
        return "📂 No category data available yet.";
      }

      const categories = [...new Set(products.map(p => p.category))];
      const categoryStats = categories.map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
      }));

      return `📂 **Product Categories:**\n\n${categoryStats.map(c => 
        `• ${c.name}: ${c.count} products`
      ).join('\n')}`;
    }

    // ANALYTICS / INSIGHTS
    if (input.includes('insight') || input.includes('analytics') || input.includes('report')) {
      const lowStock = products.filter(p => p.stock <= p.reorder).length;
      const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
      const avgBill = bills.length ? totalRevenue / bills.length : 0;

      return `📊 **Business Insights:**\n\n📦 Inventory:\n• Total Products: ${products.length}\n• Low Stock Alerts: ${lowStock}\n\n💰 Sales:\n• Total Revenue: ₹${totalRevenue.toFixed(2)}\n• Total Transactions: ${bills.length}\n• Average Bill: ₹${avgBill.toFixed(2)}\n\n${lowStock > 0 ? `⚠️ Action Required: ${lowStock} products need reordering!` : '✅ Inventory status is healthy!'}`;
    }

    // HELP / WHAT CAN YOU DO
    if (input.includes('help') || input.includes('can you') || input.includes('what')) {
      return `🤖 **I can help you with:**\n\n📦 Inventory Management:\n• Check stock levels\n• Identify low stock items\n• Reorder recommendations\n\n💰 Sales Analytics:\n• Today's revenue\n• Total sales summary\n• Average bill value\n\n📊 Business Insights:\n• Best selling products\n• Category analysis\n• Performance reports\n\n💡 Try asking:\n• "What's today's revenue?"\n• "Which items are low in stock?"\n• "Show me best selling products"`;
    }

    // GREETINGS
    if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
      return `👋 Hello! I'm ChainAI, your supply chain assistant. I can help you with inventory management, sales analytics, and business insights. What would you like to know?`;
    }

    // THANKS
    if (input.includes('thank') || input.includes('thanks')) {
      return `You're welcome! 😊 Let me know if you need anything else!`;
    }

    // DEFAULT RESPONSE
    return `I understand you're asking about "${userInput}". \n\nI can help you with:\n• Stock levels and inventory\n• Sales and revenue data\n• Reorder recommendations\n• Business analytics\n\nCould you please rephrase your question or try one of the suggestions below?`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = generateResponse(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setLoading(false);
    }, 800);
  };

  const suggestions = [
    { text: "Check stock levels", icon: Package },
    { text: "Today's revenue", icon: DollarSign },
    { text: "What to reorder?", icon: AlertCircle },
    { text: "Best selling products", icon: TrendingUp }
  ];

  const resetChat = () => {
    setMessages([
      { role: 'ai', content: 'Hello! I am your Smart Supply Chain Assistant. How can I help you today?' }
    ]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white rounded-[32px] shadow-2xl shadow-indigo-200 border border-indigo-50 flex flex-col overflow-hidden mb-6 animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold leading-none">ChainAI Assistant</h3>
                <p className="text-white/70 text-[10px] mt-1 uppercase tracking-wider font-bold">Smart Responses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetChat} 
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
                title="Reset chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-[24px] text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-white text-slate-700 rounded-tl-none shadow-md border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-[24px] rounded-tl-none flex gap-1.5 shadow-md border border-slate-100">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all"
                  >
                    <s.icon className="w-3.5 h-3.5" />
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
                disabled={loading}
                className="w-full pl-6 pr-14 py-4 bg-white border-2 border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-full outline-none shadow-sm font-medium text-sm placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
        className="group relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-xl shadow-indigo-300 hover:shadow-2xl hover:shadow-indigo-400 transition-all active:scale-95"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
        </div>
        <span className="font-bold tracking-tight">AI Assistant</span>
      </button>
    </div>
  );
};

export default Chatbot;
