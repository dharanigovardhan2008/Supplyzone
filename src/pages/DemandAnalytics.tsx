import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Activity, 
  Clock,
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useRealTimeData } from '../hooks/useRealTimeData';

const DemandAnalytics = () => {
  const { products, recentBills } = useRealTimeData();

  // Calculate product performance
  const productPerformance = products.map(p => {
    const totalSold = recentBills.reduce((acc, b) => {
      const item = b.items.find(i => i.product_id === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return { ...p, totalSold };
  }).sort((a, b) => b.totalSold - a.totalSold);

  const hotProducts = productPerformance.slice(0, 5);
  
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  const categoryData = products.reduce((acc: any[], p) => {
    const existing = acc.find(c => c.name === p.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: p.category, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Demand Intelligence</h1>
        <p className="text-slate-500 font-medium">Predictive analysis and market trend identification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Hot Products List */}
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-slate-900">Hot Products Ranking</h3>
              </div>
              <div className="flex gap-2">
                {['Today', 'Week', 'Month'].map(t => (
                  <button key={t} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    t === 'Week' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {hotProducts.map((p, i) => (
                <div key={p.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                    i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{p.category}</p>
                  </div>
                  <div className="text-center px-8 border-x border-slate-100">
                    <p className="text-xl font-black text-slate-900">{p.totalSold}</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase">Units Sold</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                      <ChevronUp className="w-4 h-4" />
                      12%
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Hot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demand Forecasting Chart */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              Sales Velocity Chart
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotProducts.map(p => ({ name: p.name, sales: p.totalSold }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <TrendingUp className="w-10 h-10 mb-6" />
              <h4 className="text-2xl font-black mb-2">Weekly High</h4>
              <p className="text-indigo-100 text-sm font-medium mb-6">Your sales volume is up 24% compared to last week.</p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-[50px] font-black text-sm hover:scale-105 transition-transform">
                View Reports
              </button>
            </div>
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandAnalytics;
