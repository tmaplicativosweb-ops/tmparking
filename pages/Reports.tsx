
import React from 'react';
import { AppState } from '../types';
import { Card, Button } from '../components/UI';
import { Printer, Download, TrendingUp, ShoppingBag, Car } from 'lucide-react';

interface Props {
  state: AppState;
}

export const Reports: React.FC<Props> = ({ state }) => {
  // --- Data Aggregation ---
  const totalParkingRevenue = state.transactions
    .filter(t => t.type === 'INCOME' && (t.category === 'PARKING' || t.category === 'SUBSCRIPTION'))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalStoreRevenue = state.transactions
    .filter(t => t.type === 'INCOME' && t.category === 'STORE_SALE')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = state.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const parkingCount = state.transactions.filter(t => t.category === 'PARKING').length;
  const storeCount = state.transactions.filter(t => t.category === 'STORE_SALE').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.transactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "relatorio_transacoes.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios Gerenciais</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Exportar JSON
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} /> Imprimir Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <Car className="text-blue-500" />
            <h3 className="font-bold text-lg">Estacionamento</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Arrecadado</span>
              <span className="font-bold">R$ {totalParkingRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Veículos Rotativos</span>
              <span className="font-bold">{parkingCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mensalistas Ativos</span>
              <span className="font-bold">{state.customers.filter(c => c.isActive).length}</span>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="text-orange-500" />
            <h3 className="font-bold text-lg">Loja & Conveniência</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Vendas Totais</span>
              <span className="font-bold">R$ {totalStoreRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Transações</span>
              <span className="font-bold">{storeCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Produtos Cadastrados</span>
              <span className="font-bold">{state.products.length}</span>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-500" />
            <h3 className="font-bold text-lg">Resumo Financeiro</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Receita Bruta</span>
              <span className="font-bold text-green-600">R$ {(totalParkingRevenue + totalStoreRevenue).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Despesas Operacionais</span>
              <span className="font-bold text-red-600">- R$ {totalExpenses.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between text-base">
              <span className="font-bold text-slate-800 dark:text-white">Lucro Líquido</span>
              <span className="font-bold text-brand-600">R$ {(totalParkingRevenue + totalStoreRevenue - totalExpenses).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="print-only mt-8">
        <h3 className="text-xl font-bold mb-4 border-b border-black">Detalhamento de Transações (Últimos 30 dias)</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Data</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Descrição</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {state.transactions.slice(0, 50).map(t => (
              <tr key={t.id} className="border-b border-gray-200">
                <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-2">{t.category}</td>
                <td className="py-2">{t.description}</td>
                <td className="py-2 text-right">R$ {t.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
