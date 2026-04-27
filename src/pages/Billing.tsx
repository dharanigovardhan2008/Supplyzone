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

  // ✅ Dynamic categories derived from actual products data
  const categories = ['All', ...Array.from(new Set(products.map((p: Product) => p.category))).sort()];

  const filteredProducts = products.filter((p: Product) => {
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
          const product = products.find((p: Product) => p.id === id);
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

          {/* ✅ Dynamic category pills */}
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
            {filteredProducts.map((product: Product) => {
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
                  <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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

                  <div className="p-3 space-y-1">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">
                      {product.category}
                    </p>
                    <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 min-h-[2.5em]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-black text-slate-900">
                        ₹{product.selling_price.toLocaleString('en-IN')}
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
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-white shadow-sm">
                  <ProductImage
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate leading-tight">
                    {item.product_name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {item.category}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-bold text-slate-500">
                      ₹{item.unit_price.toLocaleString('en-IN')} × {item.quantity}
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      ₹{item.total_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

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
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>GST (18%)</span>
              <span className="text-slate-700">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center bg-white rounded-2xl px-5 py-4 shadow-lg shadow-indigo-500/5 border border-indigo-50 mt-1">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total Payable</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Customer name (optional)..."
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 rounded-2xl outline-none font-medium text-sm shadow-sm transition-all"
          />

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

        {/* ── Print Receipt (hidden on screen, shown on print) ── */}
        {lastBill && (
          <div className="hidden print:block">
            <style>{`
              @page {
                size: A5;
                margin: 0;
              }
              @media print {
                body * { visibility: hidden; }
                .print-receipt, .print-receipt * { visibility: visible; }
                .print-receipt { position: fixed; top: 0; left: 0; width: 100%; }
              }
            `}</style>

            <div
              className="print-receipt"
              style={{
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#111',
                maxWidth: '480px',
                margin: '0 auto',
                padding: '48px 44px',
                background: '#fff',
              }}
            >
              {/* ── Logo + Brand ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: '#4f46e5',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Package style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px', color: '#111' }}>
                    SupplyChain AI
                  </p>
                  <p style={{ fontSize: '10px', color: '#888', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Official Tax Invoice
                  </p>
                </div>
              </div>

              {/* ── Top divider ── */}
              <div style={{ height: '2px', background: '#111', marginBottom: '24px' }} />

              {/* ── Invoice Meta Row ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                  <p style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px' }}>Invoice No.</p>
                  <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 6px', color: '#111' }}>
                    #{lastBill.bill_number}
                  </p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0 0 2px' }}>
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px' }}>Billed To</p>
                  <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 8px', color: '#111' }}>
                    {lastBill.customer_name}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    background: '#eef2ff',
                    color: '#4338ca',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                  }}>
                    {lastBill.payment_method}
                  </span>
                </div>
              </div>

              {/* ── Items Table ── */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #111' }}>
                    <th style={{ textAlign: 'left', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0 10px', fontWeight: '600' }}>
                      Item
                    </th>
                    <th style={{ textAlign: 'center', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0 10px', fontWeight: '600', width: '40px' }}>
                      Qty
                    </th>
                    <th style={{ textAlign: 'right', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0 10px', fontWeight: '600', width: '80px' }}>
                      Rate
                    </th>
                    <th style={{ textAlign: 'right', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0 10px', fontWeight: '600', width: '90px' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '0.5px solid #eee' }}>
                      <td style={{ padding: '12px 0' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 3px', color: '#111' }}>
                          {item.product_name}
                        </p>
                        <p style={{ fontSize: '9px', color: '#4f46e5', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {item.category}
                        </p>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#555' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '12px', color: '#777' }}>
                        ₹{item.unit_price.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111' }}>
                        ₹{item.total_price.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Totals ── */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                  <div style={{ width: '260px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Subtotal</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                      ₹{lastBill.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <div style={{ width: '260px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>GST @ 18%</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                      ₹{lastBill.tax_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Grand Total */}
                <div style={{
                  background: '#4f46e5',
                  borderRadius: '14px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '9px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px', fontWeight: '700' }}>
                      Total Payable
                    </p>
                    <p style={{ fontSize: '10px', color: '#c7d2fe', margin: 0, fontWeight: '500' }}>
                      Inclusive of all taxes
                    </p>
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                    ₹{lastBill.grand_total.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* ── Items count summary ── */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '28px',
                border: '0.5px solid #e2e8f0',
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  {lastBill.items.length} item{lastBill.items.length !== 1 ? 's' : ''} purchased
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  {lastBill.items.reduce((a: number, i: any) => a + i.quantity, 0)} units total
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  Saved ₹{Math.round(lastBill.items.reduce((a: number, i: any) => a + i.profit, 0) * 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ── Bottom divider ── */}
              <div style={{ height: '2px', background: '#111', marginBottom: '20px' }} />

              {/* ── Footer ── */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#111', margin: '0 0 6px' }}>
                  Thank you for your business!
                </p>
                <p style={{ fontSize: '10px', color: '#bbb', margin: '0 0 2px', letterSpacing: '0.5px' }}>
                  This is a computer-generated invoice and does not require a signature.
                </p>
                <p style={{ fontSize: '10px', color: '#ccc', margin: 0 }}>
                  SupplyChain AI · {new Date().getFullYear()}
                </p>
              </div>
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
