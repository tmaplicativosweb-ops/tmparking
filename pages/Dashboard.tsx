import React from 'react';
import { AppState, TicketStatus } from '../types';
import { Card, Badge } from '../components/UI';
import { TrendingUp, Car, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  // KPIs
  const occupiedSpots = state.spots.filter(s => s.isOccupied).length;
  const totalSpots = state.spots.length;
  const occupancyRate = Math.round((occupiedSpots / totalSpots) * 100);
  
  // Financials Today
  const today = new Date().setHours(0,0,0,0);
  const todaysRevenue = state.transactions
    .filter(t => t.type === 'INCOME' && t.date >= today)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Late Monthly Subs
  const now = Date.now();
  const lateCustomers = state.customers.filter(c => c.isActive && c.dueDate < new Date().getDate() && (!c.lastPayment || c.lastPayment < (now - 2592000000)));

  // Chart Data (Mock last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStart = d.setHours(0,0,0,0);
    const dayEnd = d.setHours(23,59,59,999);
    
    const revenue = state.transactions
      .filter(t => t.type === 'INCOME' && t.date >= dayStart && t.date <= dayEnd)
      .reduce((acc, c) => acc + c.amount, 0);

    return {
      name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      revenue
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h2>
        <span className="text-sm text-slate-500">Atualizado agora</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30">
            <Car size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ocupação</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{occupiedSpots}/{totalSpots}</h3>
            <span className={`text-xs ${occupancyRate > 80 ? 'text-red-500' : 'text-green-500'}`}>{occupancyRate}% cheio</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/30">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Faturamento Hoje</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">R$ {todaysRevenue.toFixed(2)}</h3>
            <span className="text-xs text-green-500">+12% vs ontem</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg dark:bg-orange-900/30">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mensalistas Atrasados</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{lateCustomers.length}</h3>
            <span className="text-xs text-slate-500">De {state.customers.length} totais</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tickets Ativos</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {state.tickets.filter(t => t.status === TicketStatus.ACTIVE).length}
            </h3>
          </div>
        </Card>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-96">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Receita Semanal</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div>
          <Card className="h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Atividade Recente</h3>
            <div className="space-y-4">
              {state.transactions.slice(0, 8).map(t => (
                <div key={t.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleTimeString()}</p>
                  </div>
                  <Badge color={t.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    R$ {t.amount.toFixed(2)}
                  </Badge>
                </div>
              ))}
              {state.transactions.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">Nenhuma atividade recente.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};