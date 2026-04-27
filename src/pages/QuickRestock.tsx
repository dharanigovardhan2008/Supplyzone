import React, { useState } from 'react';
import { Truck, PackageCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const QuickRestock = () => {
  const { products } = useRealTimeData();
  const [maxStockInputs, setMaxStockInputs] = useState<{ [key: string]: number }>({});

  const handleSetMaxStock = async (product: any) => {
    const newMax = maxStockInputs[product.id];
    if (!newMax || newMax <= 0) {
      alert('Please enter a valid max stock value.');
      return;
    }
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        max_stock: newMax,
        updated_at: serverTimestamp()
      });
      alert(`✅ Max stock for "${product.name}" set to ${newMax}!`);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update max stock.');
    }
  };

  const handleRestock = async (product: any) => {
    if (!product.max_stock || product.max_stock <= 0) {
      alert(`Cannot restock "${product.name}": Max stock is not set.`);
      return;
    }
    if (product.current_stock >= product.max_stock) {
      alert(`"${product.name}" is already at full capacity (${product.max_stock} units).`);
      return;
    }
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        current_stock: product.max_stock,
        updated_at: serverTimestamp()
      });
      alert(`✅ Restocked "${product.name}" to full capacity (${product.max_stock} units)!`);
    } catch (err) {
      console.error(err);
      alert('❌ Restock failed. Please try again.');
    }
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.reorder_point);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Quick Restock Hub</h1>
          <p className="text-slate-500 font-medium">One-click replenishment for critical inventory items.</p>
        </div>
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center gap-3">
          <Truck className="w-6 h-6" />
          <span className="font-bold">{lowStockProducts.length} Priority Deliveries</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lowStockProducts.length > 0 ? (
          lowStockProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                  <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{product.name}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{product.category}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-5 mb-6 flex justify-between items-center border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current</p>
                  <p className="text-xl font-black text-rose-500">{product.current_stock}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Capacity</p>
                  <p className="text-xl font-black text-emerald-500">{product.max_stock}</p>
                </div>
              </div>

              {(!product.max_stock || product.max_stock <= 0) ? (
                <div className="space-y-3">
                  <p className="text-xs text-rose-400 font-semibold text-center">
                    ⚠️ Max stock not set. Enter a value to enable restock.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Enter max stock"
                      value={maxStockInputs[product.id] || ''}
                      onChange={e => setMaxStockInputs(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={() => handleSetMaxStock(product)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm transition-all"
                    >
                      Set
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleRestock(product)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[50px] font-black text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 group-hover:scale-105 active:scale-95"
                >
                  <PackageCheck className="w-5 h-5" />
                  Confirm Full Restock
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Stock Levels Healthy</h3>
            <p className="text-slate-500 font-medium">All products are currently above their reorder points.</p>
          </div>
        )}
      </div>

      {products.length > lowStockProducts.length && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 px-6">
            <RefreshCw className="w-6 h-6 text-slate-400" />
            Standard Inventory
          </h2>
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Health</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Restock Value</th>
                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.filter(p => p.current_stock > p.reorder_point).map(product => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 flex items-center gap-4">
                        <img src={product.image_url} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                        <span className="font-bold text-slate-700">{product.name}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(product.current_stock / product.max_stock) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-500">
                        {product.max_stock - product.current_stock} units
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleRestock(product)}
                          className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                          Fill to Max
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickRestock;
