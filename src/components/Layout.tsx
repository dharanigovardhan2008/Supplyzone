import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Package, 
  BarChart3, 
  Boxes, 
  BrainCircuit, 
  LineChart, 
  Settings, 
  LogOut,
  User,
  ChevronRight,
  Menu,
  X,
  Truck
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-6 py-3.5 rounded-[50px] transition-all duration-200 group ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
    <ChevronRight className={`ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity`} />
  </NavLink>
);

const SidebarSection = ({ title, children }: any) => (
  <div className="mb-6">
    <h3 className="px-6 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">SupplyChain</h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">AI Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
            <SidebarSection title="General">
              <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </SidebarSection>

            <SidebarSection title="Billing">
              <SidebarItem to="/billing" icon={ShoppingCart} label="POS Billing" />
              <SidebarItem to="/billing/history" icon={History} label="Bill History" />
              <SidebarItem to="/products" icon={Package} label="Product Catalog" />
            </SidebarSection>

            <SidebarSection title="Management">
              <SidebarItem to="/restock" icon={Truck} label="Quick Restock" />
            </SidebarSection>

            <SidebarSection title="Analytics">
              <SidebarItem to="/analytics/demand" icon={BarChart3} label="Demand Analytics" />
              <SidebarItem to="/analytics/inventory" icon={Boxes} label="Inventory Intel" />
              <SidebarItem to="/analytics/insights" icon={BrainCircuit} label="AI Insights" />
              <SidebarItem to="/analytics/revenue" icon={LineChart} label="Revenue Reports" />
            </SidebarSection>

            <SidebarSection title="System">
              <SidebarItem to="/settings" icon={Settings} label="Settings" />
            </SidebarSection>
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 mb-2 bg-slate-50 rounded-3xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">Manager</p>
                <p className="text-xs text-slate-500 truncate">{auth.currentUser?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-6 py-3 text-red-500 hover:bg-red-50 rounded-[50px] transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-indigo-600 w-6 h-6" />
            <span className="font-bold">SupplyChain</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-xl">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
