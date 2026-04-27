import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  BrainCircuit, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { model } from '../gemini';

const AIInsights = () => {
  const { insights, products, recentBills, alerts } = useRealTimeData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateFreshInsights = async () => {
    setIsRefreshing(true);
    try {
      const prompt = `
        You are a supply chain AI assistant. 
        Recent Bills: ${JSON.stringify(recentBills.slice(0, 10))}
        Current Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.current_stock, category: p.category })))}
        Alerts: ${JSON.stringify(alerts.slice(0, 5))}
        
        Analyze this and return ONLY a JSON array with 3 fresh high-quality actionable insights.
        Return ONLY the JSON array.
        [
          {
            "type": "REORDER" | "DEAD_STOCK" | "TREND" | "REVENUE",
            "severity": "HIGH" | "MEDIUM" | "LOW",
            "title": "Short title",
            "message": "Actionable message",
            "product": "Name",
            "action": "What to do"
          }
        ]
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const newInsights = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
      
      for (const insight of newInsights) {
        await addDoc(collection(db, 'ai_insights'), {
          ...insight,
          action_taken: false,
          created_at: serverTimestamp()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTakeAction = async (id: string) => {
    await updateDoc(doc(db, 'ai_insights', id), {
      action_taken: true
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-xl shadow-indigo-100">
            <BrainCircuit className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">AI Intelligence</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Powered by Google Gemini 1.5 Flash
            </p>
          </div>
        </div>
        <button 
          onClick={generateFreshInsights}
          disabled={isRefreshing}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Generate New Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border-l-4 border-rose-500 shadow-sm">
          <p className="text-rose-500 text-xs font-black uppercase tracking-widest mb-1">Critical Alerts</p>
          <p className="text-3xl font-black text-slate-900">{insights.filter(i => i.severity === 'HIGH').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border-l-4 border-amber-500 shadow-sm">
          <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Trend Warnings</p>
          <p className="text-3xl font-black text-slate-900">{insights.filter(i => i.severity === 'MEDIUM').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border-l-4 border-emerald-500 shadow-sm">
          <p className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-1">Optimization</p>
          <p className="text-3xl font-black text-slate-900">{insights.filter(i => i.severity === 'LOW').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {insights.length > 0 ? insights.map((insight) => (
          <div 
            key={insight.id}
            className={`bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all ${
              insight.action_taken ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${
                insight.insight_type === 'REORDER' ? 'bg-rose-50 text-rose-600' :
                insight.insight_type === 'TREND' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {insight.insight_type === 'REORDER' ? <Package className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                insight.severity === 'HIGH' ? 'bg-rose-50 text-rose-600' :
                insight.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {insight.severity} Priority
              </span>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">{insight.title}</h3>
            <p className="text-slate-500 font-medium mb-6 leading-relaxed">
              {insight.message}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Recently Generated</span>
              </div>
              {!insight.action_taken ? (
                <button 
                  onClick={() => handleTakeAction(insight.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors group-hover:scale-105 active:scale-95"
                >
                  {insight.action}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Action Taken
                </div>
              )}
            </div>

            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full -z-10 group-hover:scale-110 transition-transform"></div>
          </div>
        )) : (
          <div className="lg:col-span-2 text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No AI Insights Yet</h3>
            <p className="text-slate-500 font-medium mb-8">Generate fresh insights by clicking the button above.</p>
            <button 
              onClick={generateFreshInsights}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-100"
            >
              Trigger AI Engine
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
