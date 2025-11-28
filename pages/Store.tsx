
import React, { useState } from 'react';
import { AppState, Product, PaymentMethod } from '../types';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { Plus, ShoppingCart, Trash2, Package, Search, Barcode } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (newState: AppState) => void;
}

export const Store: React.FC<Props> = ({ state, updateState }) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'INVENTORY'>('POS');
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inventory State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  // --- POS Logic ---
  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert('Produto sem estoque!');
    
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return alert('Estoque insuficiente!');
      setCart(cart.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.product.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

  const handleCheckout = (method: PaymentMethod) => {
    if (cart.length === 0) return;

    // 1. Create Transaction
    const transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'INCOME' as const,
      category: 'STORE_SALE' as const,
      amount: cartTotal,
      description: `Venda Loja (${cart.length} itens)`,
      date: Date.now(),
      paymentMethod: method
    };

    // 2. Update Stock
    const updatedProducts = state.products.map(p => {
      const inCart = cart.find(c => c.product.id === p.id);
      if (inCart) {
        return { ...p, stock: p.stock - inCart.qty };
      }
      return p;
    });

    updateState({
      ...state,
      transactions: [transaction, ...state.transactions],
      products: updatedProducts
    });

    setCart([]);
    alert('Venda realizada com sucesso!');
  };

  // --- Inventory Logic ---
  const handleSaveProduct = () => {
    if (!editingProduct.name || !editingProduct.price) return;

    let newProducts = [...state.products];
    if (editingProduct.id) {
      newProducts = newProducts.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p);
    } else {
      const newProd: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: editingProduct.name,
        price: Number(editingProduct.price),
        cost: Number(editingProduct.cost || 0),
        stock: Number(editingProduct.stock || 0),
        category: editingProduct.category || 'Geral',
        barcode: editingProduct.barcode
      };
      newProducts.push(newProd);
    }

    updateState({ ...state, products: newProducts });
    setIsModalOpen(false);
    setEditingProduct({});
  };

  const deleteProduct = (id: string) => {
    if (confirm('Excluir produto?')) {
      updateState({ ...state, products: state.products.filter(p => p.id !== id) });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Loja & Conveniência</h2>
        <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('POS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'POS' ? 'bg-white dark:bg-slate-600 shadow text-brand-600' : 'text-slate-500'}`}
          >
            Caixa (PDV)
          </button>
          <button 
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'INVENTORY' ? 'bg-white dark:bg-slate-600 shadow text-brand-600' : 'text-slate-500'}`}
          >
            Produtos (Estoque)
          </button>
        </div>
      </div>

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-3 text-slate-400" size={20} />
               <input 
                 className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                 placeholder="Buscar produto..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {filteredProducts.map(p => (
                 <button 
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className={`text-left p-4 rounded-xl border transition-all ${p.stock > 0 ? 'bg-white dark:bg-slate-800 border-slate-200 hover:border-brand-500 hover:shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 opacity-60 cursor-not-allowed'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 dark:text-white truncate block w-full">{p.name}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-slate-500">{p.stock} un.</div>
                      <div className="font-bold text-brand-600">R$ {p.price.toFixed(2)}</div>
                    </div>
                 </button>
               ))}
             </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-140px)] flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
                <ShoppingCart className="text-brand-600" />
                <h3 className="font-bold text-lg">Carrinho Atual</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10">Carrinho vazio</div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{item.product.name}</div>
                        <div className="text-xs text-slate-500">{item.qty} x R$ {item.product.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">R$ {(item.qty * item.product.price).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500">Total a Pagar</span>
                  <span className="text-2xl font-bold text-brand-600">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleCheckout(PaymentMethod.CASH)}>Dinheiro</Button>
                  <Button onClick={() => handleCheckout(PaymentMethod.DEBIT_CARD)} variant="secondary">Débito</Button>
                  <Button onClick={() => handleCheckout(PaymentMethod.CREDIT_CARD)} variant="secondary">Crédito</Button>
                  <Button onClick={() => handleCheckout(PaymentMethod.PIX)} variant="secondary">Pix</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <div className="flex justify-between mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input placeholder="Filtrar estoque..." className="pl-10" />
            </div>
            <Button onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}>
              <Plus size={16} /> Novo Produto
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço Custo</th>
                  <th className="p-3">Preço Venda</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {state.products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3"><Badge>{p.category}</Badge></td>
                    <td className="p-3">R$ {p.cost.toFixed(2)}</td>
                    <td className="p-3 font-bold text-green-600">R$ {p.price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`${p.stock < 5 ? 'text-red-500 font-bold' : ''}`}>{p.stock} un.</span>
                    </td>
                    <td className="p-3 text-right">
                       <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastro de Produto">
        <div className="space-y-4">
          <Input 
            label="Nome do Produto" 
            value={editingProduct.name || ''} 
            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4">
             <Input 
              label="Categoria" 
              value={editingProduct.category || ''} 
              onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
            />
             <Input 
              label="Código de Barras" 
              value={editingProduct.barcode || ''} 
              onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Custo (R$)" 
              type="number"
              value={editingProduct.cost || ''} 
              onChange={e => setEditingProduct({...editingProduct, cost: parseFloat(e.target.value)})} 
            />
            <Input 
              label="Venda (R$)" 
              type="number"
              value={editingProduct.price || ''} 
              onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
            />
            <Input 
              label="Estoque Inicial" 
              type="number"
              value={editingProduct.stock || ''} 
              onChange={e => setEditingProduct({...editingProduct, stock: parseFloat(e.target.value)})} 
            />
          </div>
          <Button className="w-full mt-4" onClick={handleSaveProduct}>Salvar Produto</Button>
        </div>
      </Modal>
    </div>
  );
};
