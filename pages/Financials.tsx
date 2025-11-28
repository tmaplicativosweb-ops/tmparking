import React, { useState } from 'react';
import { AppState, Transaction, PaymentMethod } from '../types';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { DollarSign, TrendingUp, TrendingDown, Plus, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (newState: AppState) => void;
}

export const Financials: React.FC<Props> = ({ state, updateState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    amount: 0,
    description: '',
    category: 'OTHER',
    paymentMethod: PaymentMethod.CASH
  });

  // Calculate totals
  const totalIncome = state.transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = state.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleSave = () => {
    if (!newTrans.amount || !newTrans.description) return;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: Date.now(),
      amount: Number(newTrans.amount),
      description: newTrans.description,
      type: newTrans.type as 'INCOME' | 'EXPENSE',
      category: newTrans.category as any,
      paymentMethod: newTrans.paymentMethod
    };

    updateState({
      ...state,
      transactions: [transaction, ...state.transactions]
    });

    setIsModalOpen(false);
    setNewTrans({ type: 'EXPENSE', amount: 0, description: '', category: 'OTHER', paymentMethod: PaymentMethod.CASH });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão Financeira</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Transação
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Receitas Totais</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">R$ {totalIncome.toFixed(2)}</h3>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Despesas Totais</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">R$ {totalExpense.toFixed(2)}</h3>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo em Caixa</span>
          </div>
          <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
            R$ {balance.toFixed(2)}
          </h3>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Histórico de Movimentações</h3>
          <Button variant="secondary" className="text-sm">
            <Filter size={16} /> Filtrar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-medium">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Data</th>
                <th className="p-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {state.transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3">
                    {t.type === 'INCOME' ? (
                      <Badge color="bg-green-100 text-green-700">Entrada</Badge>
                    ) : (
                      <Badge color="bg-red-100 text-red-700">Saída</Badge>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{t.description}</td>
                  <td className="p-3 text-slate-500 capitalize">{t.category.toLowerCase()}</td>
                  <td className="p-3 text-slate-500">{new Date(t.date).toLocaleString()}</td>
                  <td className={`p-3 font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {state.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Transaction Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Movimentação"
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setNewTrans({ ...newTrans, type: 'INCOME' })}
              className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${
                newTrans.type === 'INCOME' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <ArrowUpCircle /> Receita
            </button>
            <button
              onClick={() => setNewTrans({ ...newTrans, type: 'EXPENSE' })}
              className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${
                newTrans.type === 'EXPENSE' 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <ArrowDownCircle /> Despesa
            </button>
          </div>

          <Input 
            label="Descrição" 
            placeholder="Ex: Conta de Luz, Venda de Água" 
            value={newTrans.description}
            onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Valor (R$)" 
              type="number" 
              placeholder="0.00" 
              value={newTrans.amount}
              onChange={e => setNewTrans({ ...newTrans, amount: parseFloat(e.target.value) })}
            />
            <Select 
              label="Categoria"
              value={newTrans.category}
              onChange={e => setNewTrans({ ...newTrans, category: e.target.value as any })}
            >
              <option value="PARKING">Estacionamento</option>
              <option value="PRODUCT">Venda Produto</option>
              <option value="SALARY">Salário</option>
              <option value="SUBSCRIPTION">Mensalidade</option>
              <option value="OTHER">Outros</option>
            </Select>
          </div>

          <Button className="w-full mt-4" onClick={handleSave}>
            Salvar Lançamento
          </Button>
        </div>
      </Modal>
    </div>
  );
};