
import React from 'react';
import { LayoutDashboard, Car, Users, DollarSign, Settings, LogOut, Menu, X, ShoppingBag, FileText } from 'lucide-react';
import { AppState, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: AppState['currentUser'];
  onLogout: () => void;
  isDark: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user, onLogout, isDark }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'operations', label: 'Operações', icon: Car },
    { id: 'store', label: 'Loja & Conveniência', icon: ShoppingBag },
    { id: 'financials', label: 'Financeiro', icon: DollarSign },
    { id: 'customers', label: 'Mensalistas', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  // Only show Settings for ADMIN
  if (user.role === UserRole.ADMIN) {
    navItems.push({ id: 'settings', label: 'Configurações', icon: Settings });
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white dark:bg-slate-800 z-50 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center no-print">
        <h1 className="font-bold text-lg text-brand-600">TM Parking</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 no-print
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">TM Parking</h1>
              <p className="text-xs text-slate-500">SaaS Edition v2.0</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-4 px-4">
              <p className="text-sm font-medium">{user.name}</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user.role === UserRole.ADMIN ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
