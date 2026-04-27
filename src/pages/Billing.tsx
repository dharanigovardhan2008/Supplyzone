import React, { useState } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote,
  Smartphone, CheckCircle2, Printer, ChevronRight, Package
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Product, BillItem } from '../types';
import { model } from '../gemini';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=400&q=80';

const ProductImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = React.useState(src || FALLBACK_IMAGE);
  React.useEffect(() => { setImgSrc(src || FALLBACK_IMAGE); }, [src]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(FALLBACK_IMAGE)}
    />
  );
};

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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
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
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
                profit: (item.quantity + 1) * (item.unit_price - item.cost_price),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          quantity: 1,
          unit_price: product.selling_price,
          cost_price: product.cost_price,
          total_price: product.selling_price,
          profit: product.selling_price - product.cost_price,
          image_url: product.image_url || '',
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product_id !== id) return item;
          const product = products.find(p => p.id === id);
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (product && newQty > product.current_stock) return item;
          return {
            ...item,
            quantity: newQty,
            total_price: newQty * item.unit_price,
            profit: newQty * (item.unit_price - item.cost_price),
          };
        })
        .filter(Boolean) as BillItem[]
    );
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
      const billData: any = await runTransaction(db, async transaction => {
        const sanitizedItems = cart.map(item => ({
          product_id: item.product_id || '',
          product_name: item.product_name || 'Product',
          category: item.category || 'General',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          cost_price: item.cost_price || 0,
          total_price: item.total_price || 0,
          profit: item.profit || 0,
          image_url: item.image_url || '',
        }));

        const productDocs: any = {};
        for (const item of sanitizedItems) {
          const productRef = doc(db, 'products', item.product_id);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw `Product ${item.product_name} not found`;
          productDocs[item.product_id] = productSnap.data();
        }

        for (const item of sanitizedItems) {
          const productData = productDocs[item.product_id];
          const productRef = doc(db, 'products', item.product_id);
          const newStock = productData.current_stock - item.quantity;
          if (newStock < 0) throw `Insufficient stock for ${item.product_name}`;
          transaction.update(productRef, { current_stock: newStock, updated_at: serverTimestamp() });
          if (newStock <= productData.reorder_point) {
            const alertRef = doc(collection(db, 'inventory_alerts'));
            transaction.set(alertRef, {
              product_id: item.product_id,
              product_name: item.product_name,
              alert_type: 'LOW_STOCK',
              message: `${item.product_name} is running low`,
              severity: 'HIGH',
              is_read: false,
              created_at: serverTimestamp(),
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
          created_at: serverTimestamp(),
        };
        transaction.set(billRef, data);
        return data;
      });

      setLastBill(billData);
      setShowSuccess(true);
      setCart([]);
      setCustomerName('');

      try {
        const prompt = `Quick analysis of sale: ${JSON.stringify(billData)}. Return 1 JSON insight: {"insight_type": "TREND", "severity": "MEDIUM", "title": "...", "message": "...", "action": "..."}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const insight = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        await addDoc(collection(db, 'ai_insights'), { ...insight, action_taken: false, created_at: serverTimestamp() });
      } catch (e) {}
    } catch (err: any) {
      alert(`Transaction Error: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">

      {/* ───────────── LEFT PANEL ───────────── */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">

        {/* Toolbar */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-black text-slate-900 tracking-tight">POS Terminal</h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filteredProducts.length} items
            </span>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex-shrink-0 transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 rounded-2xl outline-none font-medium text-sm transition-all"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 pr-1">
            {filteredProducts.map(product => {
              const outOfStock = product.current_stock <= 0;
              const lowStock = product.current_stock <= product.reorder_point;
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all
                    ${outOfStock
                      ? 'opacity-50 grayscale cursor-not-allowed'
                      : 'cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 active:scale-[0.97]'
                    }`}
                >
                  {/* Image — fixed 1:1 aspect ratio, covers container */}
                  <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Stock badge */}
                    <span className={`absolute top-2 right-2 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tight backdrop-blur-sm ${
                      outOfStock
                        ? 'bg-slate-900/60 text-white'
                        : lowStock
                        ? 'bg-rose-500/90 text-white'
                        : 'bg-emerald-500/90 text-white'
                    }`}>
                      {outOfStock ? 'Out' : `${product.current_stock}`}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">
                      {product.category}
                    </p>
                    <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 min-h-[2.5em]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-black text-slate-900">
                        ₹{product.selling_price.toLocaleString()}
                      </span>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        outOfStock
                          ? 'bg-slate-100 text-slate-300'
                          : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───────────── RIGHT PANEL ───────────── */}
      <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden lg:sticky lg:top-0 lg:max-h-[calc(100vh-2rem)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">Active Bill</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
            title="Clear cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-slate-200" />
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                No items selected
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 bg-slate-50/60 hover:bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:shadow-indigo-500/5 p-3 transition-all"
              >
                {/* Thumbnail — fixed square */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-white shadow-sm">
                  <ProductImage
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate leading-tight">
                    {item.product_name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {item.category}
                  </p>
                  {/* Price row */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-bold text-slate-500">
                      ₹{item.unit_price.toLocaleString()} × {item.quantity}
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      ₹{item.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Qty controls */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-slate-700 leading-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary + Actions */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-100 space-y-4 flex-shrink-0">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-700">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>GST (18%)</span>
              <span className="text-slate-700">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-white rounded-2xl px-5 py-4 shadow-lg shadow-indigo-500/5 border border-indigo-50 mt-1">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total Payable</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{grandTotal.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Customer input */}
          <input
            type="text"
            placeholder="Customer name (optional)..."
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 rounded-2xl outline-none font-medium text-sm shadow-sm transition-all"
          />

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Card', icon: CreditCard },
              { id: 'Cash', icon: Banknote },
              { id: 'UPI', icon: Smartphone },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                  paymentMethod === method.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-[1.02]'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/40'
                }`}
              >
                <method.icon className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-tight">{method.id}</span>
              </button>
            ))}
          </div>

          {/* Generate Bill */}
          <button
            onClick={handleGenerateBill}
            disabled={cart.length === 0 || isGenerating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processing…
              </>
            ) : (
              <>
                Complete & Generate Bill
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* ── Hidden Print Receipt ── */}
        {lastBill && (
          <div className="hidden print:block bg-white text-black p-10 font-sans">
            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                <Package className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">CHAIN AI</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px]">Official Tax Invoice</p>
            </div>
            <div className="flex justify-between mb-10 border-y border-slate-100 py-6">
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-black mb-1 tracking-widest">Invoice</p>
                <p className="font-black text-lg text-slate-900">#{lastBill.bill_number}</p>
                <p className="text-slate-500 font-bold mt-1 text-xs">{new Date().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase text-[9px] font-black mb-1 tracking-widest">Customer</p>
                <p className="font-black text-lg text-slate-900">{lastBill.customer_name}</p>
                <p className="text-slate-500 font-bold mt-1 text-xs">Via: {lastBill.payment_method}</p>
              </div>
            </div>
            <table className="w-full mb-10">
              <thead className="border-b-2 border-slate-900">
                <tr>
                  <th className="text-left py-3 font-black uppercase text-[9px] tracking-widest">Product</th>
                  <th className="text-center py-3 font-black uppercase text-[9px] tracking-widest">Qty</th>
                  <th className="text-right py-3 font-black uppercase text-[9px] tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastBill.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-4">
                      <p className="font-black text-slate-800 text-sm">{item.product_name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{item.category}</p>
                    </td>
                    <td className="py-4 text-center font-black text-slate-700 text-sm">×{item.quantity}</td>
                    <td className="py-4 text-right font-black text-slate-900 text-sm">
                      ₹{item.total_price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col items-end gap-2 pt-6 border-t border-slate-200">
              <div className="flex justify-between w-64 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Subtotal</span>
                <span className="font-black text-slate-700">₹{lastBill.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">GST (18%)</span>
                <span className="font-black text-slate-700">₹{lastBill.tax_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 mt-4 pt-4 border-t-2 border-slate-900">
                <span className="font-black text-xl uppercase tracking-tighter">Grand Total</span>
                <span className="font-black text-2xl text-indigo-600">₹{lastBill.grand_total.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-20 text-center">
              <p className="text-slate-300 font-black uppercase text-[9px] tracking-[0.5em] mb-1">
                Thank you for your business
              </p>
              <p className="text-slate-200 text-[8px] font-bold italic">
                Generated by Smart SupplyChain AI System
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Order Confirmed</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">
              Stock updated and invoice generated successfully.
            </p>
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mb-3"
            >
              <Printer className="w-5 h-5" /> Print Invoice
            </button>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors text-sm"
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
