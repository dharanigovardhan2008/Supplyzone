import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  FileText, 
  Download, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { format } from 'date-fns';

const BillHistory = () => {
  const { recentBills } = useRealTimeData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = recentBills.filter(b => 
    b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Transaction History</h1>
          <p className="text-slate-500 font-medium">Review and manage your past sales and invoices.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" />
            Select Date
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-full font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by bill # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-[50px] outline-none font-medium transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['All Bills', 'Paid', 'Pending', 'Refunded'].map((f, i) => (
              <button 
                key={f}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Items</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{bill.bill_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">
                    {bill.created_at?.toDate ? format(bill.created_at.toDate(), 'MMM dd, hh:mm a') : 'Recently'}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-700">{bill.customer_name}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
                      {bill.items.length} items
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 text-lg">₹{bill.grand_total.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {bill.payment_method}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Filter className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Transactions Found</h3>
              <p className="text-slate-500 font-medium">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillHistory;
