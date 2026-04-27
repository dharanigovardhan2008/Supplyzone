import React, { useState, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  FileDown,
  Printer,
  ChevronRight,
  Package
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  serverTimestamp, 
  runTransaction
} from 'firebase/firestore';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Product, BillItem } from '../types';
import { model } from '../gemini';

const Billing = () => {
  const { products } = useRealTimeData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastBill, setLastBill] = useState<any>(null);

  const categories = ['All', 'Electronics', 'Fashion', 'Food', 'Industrial'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) return prev;
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price, profit: (item.quantity + 1) * (item.unit_price - item.cost_price) }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        quantity: 1,
        unit_price: product.selling_price,
        cost_price: product.cost_price,
        total_price: product.selling_price,
        profit: product.selling_price - product.cost_price,
        image_url: product.image_url || ""
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (product && newQty > product.current_stock) return item;
        if (newQty === 0) return null;
        return { 
          ...item, 
          quantity: newQty, 
          total_price: newQty * item.unit_price, 
          profit: newQty * (item.unit_price - item.cost_price) 
        };
      }
      return item;
    }).filter(Boolean) as BillItem[]);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const handleGenerateBill = async () => {
    if (cart.length === 0 || isGenerating) return;
    setIsGenerating(true);

    try {
      const billNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      const billData: any = await runTransaction(db, async (transaction) => {
        const sanitizedItems = cart.map(item => ({
          product_id: item.product_id || "",
          product_name: item.product_name || "Product",
          category: item.category || "General",
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          cost_price: item.cost_price || 0,
          total_price: item.total_price || 0,
          profit: item.profit || 0,
          image_url: item.image_url || ""
        }));

        // 1. ALL READS FIRST
        const productDocs: any = {};
        for (const item of sanitizedItems) {
          const productRef = doc(db, 'products', item.product_id);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw `Product ${item.product_name} not found`;
          productDocs[item.product_id] = productSnap.data();
        }

        // 2. ALL WRITES SECOND
        for (const item of sanitizedItems) {
          const productData = productDocs[item.product_id];
          const productRef = doc(db, 'products', item.product_id);
          
          const newStock = productData.current_stock - item.quantity;
          if (newStock < 0) throw `Insufficient stock for ${item.product_name}`;
          
          transaction.update(productRef, { 
            current_stock: newStock, 
            updated_at: serverTimestamp() 
          });

          if (newStock <= productData.reorder_point) {
            const alertRef = doc(collection(db, 'inventory_alerts'));
            transaction.set(alertRef, {
              product_id: item.product_id,
              product_name: item.product_name,
              alert_type: 'LOW_STOCK',
              message: `${item.product_name} is running low`,
              severity: 'HIGH',
              is_read: false,
              created_at: serverTimestamp()
            });
          }
        }

        const billRef = doc(collection(db, 'bills'));
        const data = {
          bill_number: billNumber,
          items: sanitizedItems,
          subtotal: Number(subtotal),
          tax_amount: Number(taxAmount),
          grand_total: Number(grandTotal),
          payment_method: paymentMethod,
          customer_name: customerName || 'Guest',
          created_at: serverTimestamp()
        };
        transaction.set(billRef, data);
        return data;
      });

      setLastBill(billData);
      setShowSuccess(true);
      setCart([]);
      setCustomerName('');
      
      // AI Logic
      try {
        const prompt = `Quick analysis of sale: ${JSON.stringify(billData)}. Return 1 JSON insight: {"insight_type": "TREND", "severity": "MEDIUM", "title": "...", "message": "...", "action": "..."}`;
        const result = await model.generateContent(prompt);
        const insight = JSON.parse(result.response.text().substring(result.response.text().indexOf('{'), result.response.text().lastIndexOf('}') + 1));
        await addDoc(collection(db, 'ai_insights'), { ...insight, action_taken: false, created_at: serverTimestamp() });
      } catch(e) {}

    } catch (err: any) {
      alert(`Transaction Error: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] no-print">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        {/* Search and Filters Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">POS Terminal</h1>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search products by name or SKU code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-[50px] outline-none font-medium transition-all text-sm"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className={`group bg-white rounded-[32px] border border-slate-100 p-4 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer relative overflow-hidden ${
                  product.current_stock <= 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
              >
                <div className="aspect-[4/3] w-full rounded-[24px] overflow-hidden mb-4 border border-slate-50 bg-slate-50">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                </div>
                <div className="space-y-1 px-1">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{product.category}</p>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                      product.current_stock <= product.reorder_point ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {product.current_stock} in stock
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 truncate text-sm">{product.name}</h3>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xl font-black text-slate-900">₹{product.selling_price.toLocaleString()}</span>
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Checkout Sidebar */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-0">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Bill</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Transaction #7721</p>
          </div>
          <button 
            onClick={() => setCart([])} 
            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
            title="Clear Cart"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
              </div>
              <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">No items selected</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="group flex flex-col bg-slate-50/50 rounded-[28px] border border-slate-100 p-4 transition-all hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white shadow-sm bg-white">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=200'} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=200'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 truncate text-sm">{item.product_name}</h4>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-slate-900 w-5 text-center text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Price</span>
                      <span className="font-bold text-slate-600 text-xs">₹{item.unit_price.toLocaleString()}</span>
                   </div>
                   <div className="text-right flex flex-col">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Item Total</span>
                      <span className="font-black text-indigo-600 text-sm">₹{item.total_price.toLocaleString()}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary and Action */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
          <div className="space-y-3 px-2">
            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
              <span>Subtotal</span>
              <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
              <span>Tax (GST 18%)</span>
              <span className="text-slate-900">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-xl shadow-indigo-500/5 border border-indigo-50 mt-4 relative overflow-hidden">
              <div className="flex flex-col relative z-10">
                <span className="text-indigo-400 font-black uppercase text-[9px] tracking-widest mb-1">Total Payable</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
               <input 
                type="text" 
                placeholder="Customer Full Name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-100 rounded-[50px] outline-none font-medium transition-all text-sm shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Card', icon: CreditCard }, 
                { id: 'Cash', icon: Banknote }, 
                { id: 'UPI', icon: Smartphone }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-[24px] border transition-all ${
                    paymentMethod === method.id 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30'
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-[9px] font-black uppercase tracking-tight">{method.id}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateBill}
              disabled={cart.length === 0 || isGenerating}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[50px] font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? 'Processing...' : 'Complete & Generate Bill'}
              {!isGenerating && <ChevronRight className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Hidden Print Content (Standard Receipt Style) */}
        {lastBill && (
          <div className="hidden print:block print-only bg-white text-black p-12 font-sans">
            <div className="flex flex-col items-center mb-12">
               <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mb-4">
                  <Package className="text-white w-10 h-10" />
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter">CHAIN AI</h1>
               <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Official Tax Invoice</p>
            </div>

            <div className="flex justify-between mb-12 border-y border-slate-100 py-8">
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-black mb-1 tracking-widest">Billing Info</p>
                <p className="font-black text-xl text-slate-900">#{lastBill.bill_number}</p>
                <p className="text-slate-500 font-bold mt-1 text-sm">{new Date().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase text-[9px] font-black mb-1 tracking-widest">Customer</p>
                <p className="font-black text-xl text-slate-900">{lastBill.customer_name}</p>
                <p className="text-slate-500 font-bold mt-1 text-sm">Via: {lastBill.payment_method}</p>
              </div>
            </div>

            <table className="w-full mb-12">
              <thead className="border-b-2 border-slate-900">
                <tr>
                  <th className="text-left py-4 font-black uppercase text-[10px] tracking-widest">Product Description</th>
                  <th className="text-center py-4 font-black uppercase text-[10px] tracking-widest">Qty</th>
                  <th className="text-right py-4 font-black uppercase text-[10px] tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastBill.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-5">
                       <p className="font-black text-slate-800">{item.product_name}</p>
                       <p className="text-[10px] text-slate-400 font-bold">{item.category}</p>
                    </td>
                    <td className="py-5 text-center font-black text-slate-700">x {item.quantity}</td>
                    <td className="py-5 text-right font-black text-slate-900">₹{item.total_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-3 pt-8 border-t border-slate-200">
              <div className="flex justify-between w-72 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="font-black text-slate-700">₹{lastBill.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-72 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">GST (18%)</span>
                <span className="font-black text-slate-700">₹{lastBill.tax_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-72 mt-6 pt-6 border-t-2 border-slate-900">
                <span className="font-black text-2xl uppercase tracking-tighter">Grand Total</span>
                <span className="font-black text-3xl text-indigo-600">₹{lastBill.grand_total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-32 text-center">
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] mb-2">Thank you for your business</p>
              <p className="text-slate-200 text-[8px] font-bold italic">Generated by Smart SupplyChain AI System</p>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Order Confirmed</h3>
            <p className="text-slate-500 font-medium mb-8">Stock has been deducted and invoice generated successfully.</p>
            
            <button 
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-[50px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mb-3"
            >
              <Printer className="w-6 h-6" /> Print Invoice
            </button>

            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-[50px] transition-colors"
            >
              Close & New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
