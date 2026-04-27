import React from 'react';
import { 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { format } from 'date-fns';

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
          trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subValue && <span className="text-xs text-slate-400 font-medium">{subValue}</span>}
    </div>
  </div>
);

const Dashboard = () => {
  const { products, recentBills, alerts, insights } = useRealTimeData();

  const todayRevenue = recentBills
    .filter(b => {
      const date = b.created_at?.toDate ? b.created_at.toDate() : new Date();
      return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    })
    .reduce((acc, b) => acc + b.grand_total, 0);

  const lowStockCount = products.filter(p => p.current_stock <= p.reorder_point).length;

  const chartData = [
    { name: '08:00', sales: 4000 },
    { name: '10:00', sales: 7000 },
    { name: '12:00', sales: 12000 },
    { name: '14:00', sales: 9000 },
    { name: '16:00', sales: 15000 },
    { name: '18:00', sales: 18000 },
    { name: '20:00', sales: 11000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Good Morning, Manager!</h1>
          <p className="text-indigo-100 text-lg font-medium opacity-80">
            Everything is running smoothly. You have {lowStockCount} items that need attention.
          </p>
          <div className="flex gap-4 mt-8">
            <button className="px-8 py-3 bg-white text-indigo-600 rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 text-sm">
              Generate Report
            </button>
            <button className="px-8 py-3 bg-indigo-500/50 backdrop-blur-md text-white border border-indigo-400 rounded-full font-bold hover:bg-indigo-500 transition-colors text-sm">
              View Alerts
            </button>
          </div>
        </div>
        {/* Abstract Shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Today's Revenue" value={`₹${todayRevenue.toLocaleString()}`} icon={DollarSign} color="indigo" trend={12} />
        <StatCard title="Bills Generated" value={recentBills.length} icon={Receipt} color="blue" trend={8} />
        <StatCard title="Top Product" value="Laptop" subValue="12 Sold" icon={TrendingUp} color="emerald" trend={15} />
        <StatCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} color="rose" />
        <StatCard title="Active POs" value="04" icon={Target} color="amber" />
        <StatCard title="AI Insights" value={insights.length} icon={Zap} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Today's Hourly Sales</h3>
              <p className="text-slate-500 text-sm font-medium">Real-time revenue monitoring</p>
            </div>
            <select className="bg-slate-50 border-none rounded-full px-6 py-2 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-indigo-100">
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '15px'}}
                  cursor={{stroke: '#6366f1', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">AI Intelligence</h3>
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-6">
            {insights.length > 0 ? insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors cursor-pointer">
                <div className="flex gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    insight.severity === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{insight.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-3">{insight.message}</p>
                    <button className="text-indigo-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {insight.action} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No fresh insights yet.<br/>Generate a bill to trigger AI.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bills */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-indigo-600 text-sm font-bold">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Bill ID</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBills.slice(0, 5).map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-900">{bill.bill_number}</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{bill.customer_name || 'Guest'}</td>
                    <td className="px-8 py-5 text-sm font-bold text-indigo-600">₹{bill.grand_total.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Inventory Alerts</h3>
            <button className="text-rose-600 text-sm font-bold">Action Needed</button>
          </div>
          <div className="p-8 space-y-4">
            {products.filter(p => p.current_stock <= p.reorder_point).slice(0, 4).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-3xl border border-rose-100/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                    <img src={product.image_url || 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=200'} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
                    <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">Stock: {product.current_stock}</p>
                  </div>
                </div>
                <button className="px-5 py-2 bg-white text-rose-600 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
