
import React, { useEffect, useState, useRef } from 'react';
import { AppState, License, UserRole, User, ParkingSpot, VehicleType, RateConfig } from './types';
import { StorageService } from './services/storage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Financials } from './pages/Financials';
import { Customers } from './pages/Customers';
import { Store } from './pages/Store';
import { Reports } from './pages/Reports';
import { Card, Button, Input, Select, Modal } from './components/UI';
import { ShieldAlert, CheckCircle, Unlock, Key, Copy, PlayCircle, Lock, Save, Upload, Trash2, UserPlus, DollarSign } from 'lucide-react';

// --- License Guard Component (Unchanged logic, just keeping structure) ---
const LicenseGuard: React.FC<{ 
  license: License | null; 
  onActivate: (key: string) => void;
  onDemo: () => void;
}> = ({ license, onActivate, onDemo }) => {
  const [key, setKey] = useState('');
  const isValid = license && license.isActive && license.validUntil > Date.now();

  if (isValid) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Licença Necessária</h1>
          <p className="text-slate-500 mt-2">
            {license ? 'Sua licença expirou.' : 'Ative o sistema para começar a operar.'}
          </p>
        </div>
        <div className="text-left">
          <Input 
            label="Chave de Licença (UUID)" 
            placeholder="TM-PRO-XXXXXX-YYYY" 
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={() => onActivate(key)}>Ativar Sistema</Button>
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs">Ou</span>
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        </div>
        <button 
          onClick={onDemo}
          className="text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center justify-center gap-2 w-full"
        >
          <PlayCircle size={16} /> Ativar Modo Demo (3 dias)
        </button>
      </div>
    </div>
  );
};

// --- Login Screen ---
const LoginScreen: React.FC<{ onLogin: (u: string, p: string) => void, users: User[] }> = ({ onLogin, users }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLoginAttempt = () => {
    // Check against registered users
    const foundUser = users.find(u => u.username === user && u.password === pass);
    if (foundUser) {
      onLogin(foundUser.username, foundUser.password);
    } else {
      setError('Credenciais inválidas.');
    }
  }

  return (
     <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full space-y-6">
           <div className="text-center">
              <h1 className="text-2xl font-bold text-brand-600">TM Parking</h1>
              <p className="text-sm text-slate-500">Acesso Restrito</p>
           </div>
           
           <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded text-xs text-center">
              <strong>Credenciais Padrão:</strong><br/>
              Usuário: admin<br/>
              Senha: admin123
           </div>

           <div className="space-y-4">
             <Input label="Usuário" value={user} onChange={e => setUser(e.target.value)} placeholder="admin" />
             <Input label="Senha" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && handleLoginAttempt()} />
             {error && <p className="text-red-500 text-sm">{error}</p>}
           </div>

           <Button className="w-full" onClick={handleLoginAttempt}>
             Entrar <Unlock className="ml-2 w-4 h-4" />
           </Button>
        </Card>
     </div>
  )
}

function App() {
  const [state, setState] = useState<AppState>(StorageService.load());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Reseller & Settings State
  const [genOwner, setGenOwner] = useState('');
  const [genDays, setGenDays] = useState('30');
  const [generatedKey, setGeneratedKey] = useState('');
  const [resellerUnlocked, setResellerUnlocked] = useState(false);
  const [masterPassInput, setMasterPassInput] = useState('');
  const [masterError, setMasterError] = useState('');
  
  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.OPERATOR });
  
  // Parking Spot Config
  const [spotCountInput, setSpotCountInput] = useState(state.spots.length.toString());

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    if (!loading) StorageService.save(state);
    if (state.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state, loading]);

  const updateState = (newState: AppState) => {
    setState(newState);
  };

  const handleLicenseActivation = (key: string) => {
    if (key.startsWith('TM-PRO-')) {
       const newLicense = StorageService.generateLicense('Licença Validada', 30);
       newLicense.key = key; 
       updateState({ ...state, license: newLicense });
    } else {
       alert("Chave inválida!");
    }
  };

  const handleDemoMode = () => {
    const demoLicense = StorageService.generateLicense('Modo Demonstração', 3);
    updateState({ ...state, license: demoLicense });
  };

  const handleLogin = (u: string, p: string) => {
    const dbUser = state.users.find(usr => usr.username === u);
    if (dbUser) {
      updateState({ 
        ...state, 
        currentUser: { 
          isLoggedIn: true, 
          name: dbUser.name, 
          username: dbUser.username,
          role: dbUser.role 
        } 
      });
    }
  }

  const handleLogout = () => {
    updateState({ ...state, currentUser: { ...state.currentUser, isLoggedIn: false } });
    setActiveTab('dashboard');
  }

  // --- Settings Functions ---

  const handleBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_tmparking_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.spots && json.transactions) {
          if(confirm('Isso substituirá todos os dados atuais. Continuar?')) {
            updateState(json);
            alert('Backup restaurado com sucesso!');
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role as UserRole
    };
    updateState({ ...state, users: [...state.users, user] });
    setIsUserModalOpen(false);
    setNewUser({ role: UserRole.OPERATOR });
  };

  const handleDeleteUser = (id: string) => {
    if (state.users.length <= 1) return alert("Não é possível remover o último usuário.");
    if (confirm('Remover usuário?')) {
      updateState({ ...state, users: state.users.filter(u => u.id !== id) });
    }
  };

  const handleUpdateSpots = () => {
    const newCount = parseInt(spotCountInput);
    if (isNaN(newCount) || newCount < 1) return;
    
    let currentSpots = [...state.spots];
    if (newCount > currentSpots.length) {
      // Add spots
      const toAdd = newCount - currentSpots.length;
      for (let i = 0; i < toAdd; i++) {
        const idx = currentSpots.length + 1;
        currentSpots.push({
          id: Math.random(), // Unique ID logic in real app better
          label: `V-${idx}`,
          type: VehicleType.CAR,
          isOccupied: false
        });
      }
    } else if (newCount < currentSpots.length) {
      // Remove spots (only if empty ideally, but for now force trim from end)
      currentSpots = currentSpots.slice(0, newCount);
    }
    updateState({ ...state, spots: currentSpots });
    alert(`Capacidade atualizada para ${newCount} vagas.`);
  };

  const handleRateChange = (vehicle: VehicleType, field: keyof RateConfig, value: string) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    const newRates = {
      ...state.settings.rates,
      [vehicle]: {
        ...state.settings.rates[vehicle],
        [field]: numVal
      }
    };

    updateState({
      ...state,
      settings: {
        ...state.settings,
        rates: newRates
      }
    });
  };

  const generateNewLicense = () => {
    const license = StorageService.generateLicense(genOwner || 'Cliente', parseInt(genDays));
    setGeneratedKey(license.key);
  };

  const unlockReseller = () => {
    if (masterPassInput === 'tmdev') {
      setResellerUnlocked(true);
      setMasterError('');
    } else {
      setMasterError('Senha Mestra incorreta.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>;

  const isLicenseValid = state.license && state.license.isActive && state.license.validUntil > Date.now();
  if (!isLicenseValid) {
     return <LicenseGuard license={state.license} onActivate={handleLicenseActivation} onDemo={handleDemoMode} />;
  }

  if (!state.currentUser.isLoggedIn) {
     return <LoginScreen onLogin={handleLogin} users={state.users} />;
  }

  const vehicles = [
    { type: VehicleType.CAR, label: 'Carro' },
    { type: VehicleType.MOTO, label: 'Moto' },
    { type: VehicleType.VAN, label: 'Van' },
    { type: VehicleType.TRUCK, label: 'Caminhão' },
  ];

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      user={state.currentUser}
      onLogout={handleLogout}
      isDark={state.settings.darkMode}
    >
      {activeTab === 'dashboard' && <Dashboard state={state} />}
      {activeTab === 'operations' && <Operations state={state} updateState={updateState} />}
      {activeTab === 'store' && <Store state={state} updateState={updateState} />}
      {activeTab === 'financials' && <Financials state={state} updateState={updateState} />}
      {activeTab === 'customers' && <Customers state={state} updateState={updateState} />}
      {activeTab === 'reports' && <Reports state={state} />}
      
      {activeTab === 'settings' && state.currentUser.role === UserRole.ADMIN && (
        <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
           
           {/* General Appearance */}
           <Card>
              <h2 className="text-xl font-bold mb-4">Aparência</h2>
              <div className="flex items-center justify-between">
                 <span>Modo Escuro</span>
                 <button 
                    onClick={() => updateState({...state, settings: {...state.settings, darkMode: !state.settings.darkMode}})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.settings.darkMode ? 'bg-brand-600' : 'bg-slate-300'}`}
                 >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${state.settings.darkMode ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>
           </Card>

           {/* Rate Configuration - NEW */}
           <Card>
             <div className="flex items-center gap-2 mb-4">
               <DollarSign className="text-brand-600" />
               <h2 className="text-xl font-bold">Tabela de Preços</h2>
             </div>
             <p className="text-sm text-slate-500 mb-4">Defina os valores cobrados por hora e a tolerância para cada tipo de veículo.</p>
             
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Veículo</th>
                      <th className="p-3">1ª Hora (R$)</th>
                      <th className="p-3">Hora Adic. (R$)</th>
                      <th className="p-3 rounded-tr-lg">Tolerância (min)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {vehicles.map((v) => (
                      <tr key={v.type}>
                        <td className="p-3 font-medium">{v.label}</td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                            value={state.settings.rates[v.type].firstHour}
                            onChange={(e) => handleRateChange(v.type, 'firstHour', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                            value={state.settings.rates[v.type].additionalHour}
                            onChange={(e) => handleRateChange(v.type, 'additionalHour', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                            value={state.settings.rates[v.type].toleranceMinutes}
                            onChange={(e) => handleRateChange(v.type, 'toleranceMinutes', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </Card>

           {/* Parking Configuration */}
           <Card>
             <h2 className="text-xl font-bold mb-4">Configuração do Estacionamento</h2>
             <div className="flex gap-4 items-end">
               <Input 
                 label="Quantidade Total de Vagas" 
                 type="number" 
                 value={spotCountInput} 
                 onChange={e => setSpotCountInput(e.target.value)}
               />
               <Button onClick={handleUpdateSpots}>Atualizar Mapa</Button>
             </div>
           </Card>

           {/* User Management */}
           <Card>
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Gestão de Funcionários</h2>
               <Button onClick={() => setIsUserModalOpen(true)} size="sm">
                 <UserPlus size={16} /> Adicionar
               </Button>
             </div>
             <div className="space-y-2">
               {state.users.map(u => (
                 <div key={u.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                   <div>
                     <p className="font-bold">{u.name}</p>
                     <p className="text-xs text-slate-500">@{u.username} • {u.role}</p>
                   </div>
                   {u.username !== 'admin' && (
                     <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700">
                       <Trash2 size={16} />
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </Card>

           {/* Backup & Data */}
           <Card>
             <h2 className="text-xl font-bold mb-4">Dados e Backup</h2>
             <div className="flex gap-4">
               <Button onClick={handleBackupDownload} variant="secondary">
                 <Save size={16} /> Fazer Backup (JSON)
               </Button>
               <div className="relative">
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   onChange={handleBackupRestore}
                   className="hidden" 
                   accept=".json"
                 />
                 <Button onClick={() => fileInputRef.current?.click()} variant="danger">
                   <Upload size={16} /> Restaurar Backup
                 </Button>
               </div>
             </div>
             <p className="text-xs text-slate-500 mt-2">
               O backup salva todos os dados (vagas, usuários, financeiro, clientes). 
               Ao restaurar, os dados atuais serão substituídos.
             </p>
           </Card>
           
           {/* License Info */}
           <Card>
              <h2 className="text-xl font-bold mb-4">Licença</h2>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                 <CheckCircle className="text-green-500 w-8 h-8" />
                 <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white">{state.license!.ownerName}</p>
                    <p className="text-sm text-slate-500">Expira em: {new Date(state.license!.validUntil).toLocaleDateString()}</p>
                 </div>
                 <Button variant="danger" className="text-sm" onClick={() => updateState({...state, license: null})}>
                   Remover
                 </Button>
              </div>
           </Card>

           {/* Reseller Panel */}
           <Card className="border-brand-200 dark:border-brand-900 ring-4 ring-brand-50 dark:ring-brand-900/20">
              <div className="flex items-center gap-2 mb-4">
                <Key className="text-brand-600" />
                <h2 className="text-xl font-bold text-brand-900 dark:text-brand-100">Painel do Revendedor</h2>
              </div>
              
              {!resellerUnlocked ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Lock size={24} className="text-slate-500" />
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    <Input 
                      type="password" 
                      placeholder="Senha Mestra" 
                      value={masterPassInput}
                      onChange={(e) => setMasterPassInput(e.target.value)}
                    />
                    {masterError && <p className="text-red-500 text-xs">{masterError}</p>}
                    <Button onClick={unlockReseller} className="w-full">Acessar Gerador</Button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input label="Nome do Cliente" value={genOwner} onChange={e => setGenOwner(e.target.value)} />
                    <Select label="Duração" value={genDays} onChange={e => setGenDays(e.target.value)}>
                      <option value="30">1 Mês</option>
                      <option value="90">3 Meses</option>
                      <option value="365">1 Ano</option>
                    </Select>
                    <div className="flex items-end"><Button className="w-full" onClick={generateNewLicense}>Gerar Chave</Button></div>
                  </div>
                  {generatedKey && (
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg border flex justify-between">
                      <div className="font-mono font-bold break-all">{generatedKey}</div>
                      <button onClick={() => navigator.clipboard.writeText(generatedKey)}><Copy /></button>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={() => { setResellerUnlocked(false); setMasterPassInput(''); setGeneratedKey(''); }} className="text-red-500 text-sm">Bloquear Painel</button>
                  </div>
                </div>
              )}
           </Card>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Novo Funcionário">
         <div className="space-y-4">
            <Input label="Nome" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            <Input label="Usuário (Login)" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            <Input label="Senha" type="password" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <Select label="Permissão" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
               <option value={UserRole.OPERATOR}>Operador (Sem acesso a configs)</option>
               <option value={UserRole.ADMIN}>Administrador</option>
            </Select>
            <Button className="w-full mt-4" onClick={handleAddUser}>Cadastrar</Button>
         </div>
      </Modal>

    </Layout>
  );
}

export default App;
