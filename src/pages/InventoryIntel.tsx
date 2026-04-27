import React from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  Plus, 
  RefreshCcw, 
  ShieldAlert,
  Truck
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InventoryIntel = () => {
  const { products, recentBills } = useRealTimeData();

  // Calculate daily sales rate and stockout prediction
  const getInventoryStatus = (product: any) => {
    const totalSold = recentBills.reduce((acc, b) => {
      const item = b.items.find(i => i.product_id === product.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    
    // Average daily sales (assuming bills are from last 7 days for simplicity)
    const dailyRate = Math.max(0.1, totalSold / 7);
    const daysUntilStockout = Math.floor(product.current_stock / dailyRate);
    
    let status = 'Healthy';
    let color = 'emerald';
    
    if (product.current_stock === 0) {
      status = 'Out of Stock';
      color = 'rose';
    } else if (daysUntilStockout < product.lead_time_days) {
      status = 'Critical';
      color = 'rose';
    } else if (daysUntilStockout < product.lead_time_days * 2) {
      status = 'Low';
      color = 'amber';
    }

    return { status, color, daysUntilStockout, dailyRate };
  };

  const createPurchaseOrder = async (product: any) => {
    const qty = product.max_stock - product.current_stock;
    await addDoc(collection(db, 'purchase_orders'), {
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      product_id: product.id,
      product_name: product.name,
      supplier_name: product.supplier_name,
      quantity_ordered: qty,
      unit_cost: product.cost_price,
      total_cost: qty * product.cost_price,
      status: 'Pending',
      expected_delivery: serverTimestamp(), // placeholder
      created_at: serverTimestamp()
    });
    alert(`Purchase Order created for ${product.name}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Inventory Intelligence</h1>
          <p className="text-slate-500 font-medium">Smart stock monitoring and automated reordering.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCcw className="w-5 h-5" />
          Refresh Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase">Healthy</p>
            <p className="text-2xl font-black text-slate-900">{products.filter(p => getInventoryStatus(p).status === 'Healthy').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase">Low Stock</p>
            <p className="text-2xl font-black text-slate-900">{products.filter(p => getInventoryStatus(p).status === 'Low').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase">Critical</p>
            <p className="text-2xl font-black text-slate-900">{products.filter(p => getInventoryStatus(p).status === 'Critical').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase">Deliveries</p>
            <p className="text-2xl font-black text-slate-900">03</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Smart Stock Monitor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stock</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Burn Rate / Day</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Stockout</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Reorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => {
                const info = getInventoryStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                          <Boxes className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-bold text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-slate-700">{product.current_stock}</span>
                      <span className="text-xs text-slate-400 font-bold ml-1">/{product.max_stock}</span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-500">{info.dailyRate.toFixed(1)} units</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 text-${info.color}-500`} />
                        <span className={`font-bold text-${info.color}-600`}>
                          {info.daysUntilStockout > 100 ? '99+ days' : `${info.daysUntilStockout} days`}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 bg-${info.color}-50 text-${info.color}-600 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                        {info.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => createPurchaseOrder(product)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryIntel;
