import React from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database, 
  Cpu,
  Mail,
  Lock,
  ChevronRight
} from 'lucide-react';
import { auth } from '../firebase';

const SettingItem = ({ icon: Icon, title, desc, action }: any) => (
  <div className="flex items-center justify-between p-6 bg-white rounded-[32px] border border-slate-100 group hover:border-indigo-200 transition-all cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-slate-400 text-xs font-medium">{desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {action && <span className="text-sm font-bold text-indigo-600">{action}</span>}
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
    </div>
  </div>
);

const Settings = () => {
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">System Settings</h1>
        <p className="text-slate-500 font-medium">Configure your supply chain preferences and AI parameters.</p>
      </div>

      <div className="space-y-4">
        <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile & Account</h3>
        <SettingItem icon={User} title="Manager Profile" desc={auth.currentUser?.email || 'manager@demo.com'} action="Edit" />
        <SettingItem icon={Mail} title="Email Notifications" desc="Manage how you receive alerts and reports" action="Enabled" />
        <SettingItem icon={Lock} title="Security & Password" desc="Two-factor authentication and login history" />
      </div>

      <div className="space-y-4">
        <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Configuration</h3>
        <SettingItem icon={Cpu} title="Gemini AI Model" desc="Flash 1.5 - Optimized for speed and actionable insights" action="v1.5-flash" />
        <SettingItem icon={Database} title="Data Synchronization" desc="Real-time Firestore sync frequency" action="Real-time" />
      </div>

      <div className="space-y-4">
        <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">General</h3>
        <SettingItem icon={Bell} title="System Alerts" desc="Configure low stock and critical priority notifications" action="12 Active" />
        <SettingItem icon={Globe} title="Regional Settings" desc="Currency (₹), Timezone (IST), and Language (English)" />
        <SettingItem icon={Shield} title="Privacy Policy" desc="How we handle your supply chain data" />
      </div>

      <div className="p-8 bg-slate-900 rounded-[40px] text-white flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold mb-1">System Backup</h4>
          <p className="text-slate-400 text-sm font-medium">Last backup was successful 2 hours ago.</p>
        </div>
        <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold transition-colors">
          Download Backup
        </button>
      </div>

      <div className="p-8 bg-white rounded-[40px] border border-rose-100 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-rose-600 mb-1">Reset Demo Data</h4>
          <p className="text-slate-400 text-sm font-medium">This will re-seed all products with correct images and sample data.</p>
        </div>
        <button 
          onClick={async () => {
            if(confirm('Are you sure? This will delete all current products and reset them.')) {
              // Logic to delete is handled by clearing collection manually in firebase usually
              // but here we just re-run seeding logic if user clicks.
              // We'll use a window reload to trigger App.tsx seeding.
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="px-8 py-3 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-full font-bold transition-all"
        >
          Reset Products
        </button>
      </div>
    </div>
  );
};

export default Settings;
