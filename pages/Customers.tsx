import React, { useState } from 'react';
import { AppState, Customer, VehicleType } from '../types';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { UserPlus, Search, AlertCircle, CheckCircle, Wallet, Trash2 } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (newState: AppState) => void;
}

export const Customers: React.FC<Props> = ({ state, updateState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    plate: '',
    phone: '',
    vehicleType: VehicleType.CAR,
    monthlyFee: 200,
    dueDate: 5,
    isActive: true
  });

  const handleSaveCustomer = () => {
    if (!newCustomer.name || !newCustomer.plate) return;

    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomer.name,
      plate: newCustomer.plate.toUpperCase(),
      phone: newCustomer.phone || '',
      vehicleType: newCustomer.vehicleType as VehicleType,
      monthlyFee: Number(newCustomer.monthlyFee),
      dueDate: Number(newCustomer.dueDate),
      isActive: true,
      lastPayment: undefined
    };

    updateState({
      ...state,
      customers: [...state.customers, customer]
    });

    setIsModalOpen(false);
    setNewCustomer({ name: '', plate: '', phone: '', vehicleType: VehicleType.CAR, monthlyFee: 200, dueDate: 5, isActive: true });
  };

  const handlePayment = (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    if (!confirm(`Confirmar pagamento de R$ ${customer.monthlyFee.toFixed(2)} para ${customer.name}?`)) return;

    // 1. Update customer payment date
    const updatedCustomers = state.customers.map(c => 
      c.id === customerId ? { ...c, lastPayment: Date.now() } : c
    );

    // 2. Add transaction
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'INCOME' as const,
      category: 'SUBSCRIPTION' as const,
      amount: customer.monthlyFee,
      description: `Mensalidade - ${customer.name}`,
      date: Date.now(),
      paymentMethod: 'CASH' as any
    };

    updateState({
      ...state,
      customers: updatedCustomers,
      transactions: [newTransaction, ...state.transactions]
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este mensalista?')) {
      updateState({
        ...state,
        customers: state.customers.filter(c => c.id !== id)
      });
    }
  };

  const isLate = (c: Customer) => {
    if (!c.lastPayment) return true;
    // Check if paid this month
    const last = new Date(c.lastPayment);
    const now = new Date();
    
    // Simplistic logic: late if paid more than 30 days ago and today > dueDate
    const daysSincePayment = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return daysSincePayment > 30 && now.getDate() > c.dueDate;
  };

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mensalistas</h2>
          <p className="text-slate-500 text-sm">{state.customers.length} clientes cadastrados</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Novo Mensalista
        </Button>
      </div>

      <Card>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <Input 
            className="pl-10" 
            placeholder="Buscar por nome ou placa..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-medium">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Placa / Veículo</th>
                <th className="p-3">Mensalidade</th>
                <th className="p-3">Vencimento</th>
                <th className="p-3">Último Pag.</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredCustomers.map((c) => {
                const late = isLate(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      {late ? (
                        <Badge color="bg-red-100 text-red-700 flex items-center gap-1 w-fit"><AlertCircle size={12}/> Atrasado</Badge>
                      ) : (
                        <Badge color="bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Em dia</Badge>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {c.name}
                      <div className="text-xs text-slate-400">{c.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                        {c.plate}
                      </div>
                      <span className="text-xs text-slate-500 ml-2">{c.vehicleType}</span>
                    </td>
                    <td className="p-3 font-bold">R$ {c.monthlyFee.toFixed(2)}</td>
                    <td className="p-3">Dia {c.dueDate}</td>
                    <td className="p-3 text-slate-500">
                      {c.lastPayment ? new Date(c.lastPayment).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <Button 
                        variant="success" 
                        className="p-2 h-8 w-8 !px-0" 
                        title="Registrar Pagamento"
                        onClick={() => handlePayment(c.id)}
                      >
                        <Wallet size={16} />
                      </Button>
                      <Button 
                        variant="danger" 
                        className="p-2 h-8 w-8 !px-0"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum mensalista encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Mensalista"
      >
        <div className="space-y-4">
          <Input 
            label="Nome Completo" 
            placeholder="Ex: João da Silva" 
            value={newCustomer.name}
            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Placa" 
              placeholder="ABC-1234" 
              value={newCustomer.plate}
              onChange={e => setNewCustomer({ ...newCustomer, plate: e.target.value })}
              maxLength={8}
            />
            <Input 
              label="Telefone" 
              placeholder="(11) 99999-9999" 
              value={newCustomer.phone}
              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Tipo Veículo"
              value={newCustomer.vehicleType}
              onChange={e => setNewCustomer({ ...newCustomer, vehicleType: e.target.value as any })}
            >
              <option value="CAR">Carro</option>
              <option value="MOTO">Moto</option>
              <option value="VAN">Van</option>
              <option value="TRUCK">Caminhão</option>
            </Select>
            <Input 
              label="Dia Vencimento" 
              type="number"
              min="1" max="31"
              value={newCustomer.dueDate}
              onChange={e => setNewCustomer({ ...newCustomer, dueDate: parseInt(e.target.value) })}
            />
          </div>

          <Input 
            label="Valor Mensalidade (R$)" 
            type="number"
            value={newCustomer.monthlyFee}
            onChange={e => setNewCustomer({ ...newCustomer, monthlyFee: parseFloat(e.target.value) })}
          />

          <Button className="w-full mt-4" onClick={handleSaveCustomer}>
            Cadastrar Cliente
          </Button>
        </div>
      </Modal>
    </div>
  );
};