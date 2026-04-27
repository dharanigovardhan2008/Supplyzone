import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  Download,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from 'recharts';
import { useRealTimeData } from '../hooks/useRealTimeData';

const RevenueReports = () => {
  const { recentBills } = useRealTimeData();

  const totalRevenue = recentBills.reduce((acc, b) => acc + b.grand_total, 0);
  const totalProfit = recentBills.reduce((acc, b) => {
    const profit = b.items.reduce((sum, i) => sum + i.profit, 0);
    return acc + profit;
  }, 0);

  const paymentData = recentBills.reduce((acc: any[], b) => {
    const existing = acc.find(p => p.name === b.payment_method);
    if (existing) {
      existing.value += b.grand_total;
    } else {
      acc.push({ name: b.payment_method, value: b.grand_total });
    }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Financial Intelligence</h1>
          <p className="text-slate-500 font-medium">Detailed revenue, profit, and payment analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-full font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <ArrowUpRight className="w-3 h-3" />
            14.2% increase
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Gross Profit</p>
          <p className="text-3xl font-black text-slate-900">₹{totalProfit.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <ArrowUpRight className="w-3 h-3" />
            8.1% increase
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Avg Bill Value</p>
          <p className="text-3xl font-black text-slate-900">₹{recentBills.length > 0 ? (totalRevenue / recentBills.length).toFixed(0) : 0}</p>
          <div className="flex items-center gap-1 text-rose-500 text-xs font-bold mt-2">
            <ArrowUpRight className="w-3 h-3" />
            2.4% decrease
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Profit Margin</p>
          <p className="text-3xl font-black text-slate-900">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <ArrowUpRight className="w-3 h-3" />
            Stable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Revenue Growth
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentBills.slice(0, 10).reverse().map(b => ({ name: b.bill_number, revenue: b.grand_total }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} dot={{r: 4, fill: '#6366f1'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600">
             <PieChartIcon className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Insights</h3>
           <p className="text-slate-500 max-w-xs">Detailed payment distribution analysis is available in the exported PDF reports.</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;
