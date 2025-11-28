
import React, { useState, useRef } from 'react';
import { AppState, ParkingSpot, VehicleType, Ticket, TicketStatus, PaymentMethod } from '../types';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { Printer, Clock, CreditCard, Banknote, QrCode, Car, CheckCircle, Search, DollarSign } from 'lucide-react';
import { StorageService } from '../services/storage';

interface Props {
  state: AppState;
  updateState: (newState: AppState) => void;
}

export const Operations: React.FC<Props> = ({ state, updateState }) => {
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  
  // Quick Search
  const [searchTerm, setSearchTerm] = useState('');

  // Entry State
  const [entryPlate, setEntryPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [lastEntryTicket, setLastEntryTicket] = useState<Ticket | null>(null);
  const [isEntrySuccessOpen, setIsEntrySuccessOpen] = useState(false);

  // Exit State
  const [exitTicket, setExitTicket] = useState<Ticket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [exitAmount, setExitAmount] = useState(0);

  // Print State (Persistent)
  const [receiptData, setReceiptData] = useState<{
    type: 'ENTRY' | 'EXIT';
    ticket: Ticket;
    amount?: number;
    spotLabel?: string;
    companyName: string;
    entryTime?: number;
    exitTime?: number;
  } | null>(null);

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setEntryPlate('');
    setVehicleType(spot.type); 
    setExitTicket(null);
    setLastEntryTicket(null);
    
    if (spot.isOccupied && spot.ticketId) {
      // Logic for Exit Calculation
      const ticket = state.tickets.find(t => t.id === spot.ticketId);
      if (ticket) {
        setExitTicket(ticket);
        const amount = StorageService.calculateFee(ticket.entryTime, Date.now(), ticket.vehicleType, state.settings.rates);
        setExitAmount(amount);
      }
    }
  };

  const handleEntry = () => {
    if (!selectedSpot || !entryPlate) return;

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      plate: entryPlate.toUpperCase(),
      vehicleType,
      entryTime: Date.now(),
      status: TicketStatus.ACTIVE,
      spotId: selectedSpot.id
    };

    const updatedSpots = state.spots.map(s => 
      s.id === selectedSpot.id ? { ...s, isOccupied: true, ticketId: newTicket.id } : s
    );

    const updatedTickets = [...state.tickets, newTicket];

    updateState({ ...state, spots: updatedSpots, tickets: updatedTickets });
    
    // Store data specifically for printing (persists even if modal closes)
    setLastEntryTicket(newTicket);
    setReceiptData({
      type: 'ENTRY',
      ticket: newTicket,
      spotLabel: selectedSpot.label,
      companyName: state.settings.companyName,
      entryTime: newTicket.entryTime
    });

    setIsEntrySuccessOpen(true);
    setSelectedSpot(null);
  };

  const handlePrintEntry = () => {
    // Small delay to ensure render
    setTimeout(() => window.print(), 150);
  };

  const handleExit = () => {
    if (!exitTicket || !selectedSpot) return;

    const completedTicket = {
      ...exitTicket,
      exitTime: Date.now(),
      status: TicketStatus.PAID,
      totalAmount: exitAmount,
      paymentMethod
    };

    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'INCOME' as const,
      category: 'PARKING' as const,
      amount: exitAmount,
      description: `Saída Placa ${completedTicket.plate}`,
      date: Date.now(),
      paymentMethod
    };

    const updatedSpots = state.spots.map(s => 
      s.id === selectedSpot.id ? { ...s, isOccupied: false, ticketId: undefined } : s
    );

    const updatedTickets = state.tickets.map(t => t.id === exitTicket.id ? completedTicket : t);
    const updatedTransactions = [...state.transactions, newTransaction];

    updateState({ ...state, spots: updatedSpots, tickets: updatedTickets, transactions: updatedTransactions });
    
    // Set Print Data
    setReceiptData({
      type: 'EXIT',
      ticket: completedTicket,
      amount: exitAmount,
      companyName: state.settings.companyName,
      entryTime: completedTicket.entryTime,
      exitTime: completedTicket.exitTime
    });

    // Auto print
    setTimeout(() => window.print(), 150);
    
    setSelectedSpot(null);
    setExitTicket(null);
  };

  const applyMinFee = () => {
    if (exitTicket) {
      setExitAmount(state.settings.rates[exitTicket.vehicleType].firstHour);
    }
  };

  // Filter spots based on search
  const filteredSpots = state.spots.filter(s => {
    if (!searchTerm) return true;
    if (s.label.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    if (s.isOccupied && s.ticketId) {
       const t = state.tickets.find(tk => tk.id === s.ticketId);
       if (t && (t.plate.includes(searchTerm.toUpperCase()) || t.id.includes(searchTerm.toUpperCase()))) return true;
    }
    return false;
  });

  // Calculate duration string
  const getDuration = (entry: number) => {
    const min = Math.ceil((Date.now() - entry) / 60000);
    const hours = Math.floor(min / 60);
    const m = min % 60;
    return `${hours}h ${m}m`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
      {/* Map Section */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mapa de Vagas</h2>
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-3 text-slate-400" size={16} />
             <input 
               className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
               placeholder="Buscar placa, ticket ou vaga..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {filteredSpots.map(spot => (
            <button
              key={spot.id}
              onClick={() => handleSpotClick(spot)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center p-2 border-2 transition-all relative
                ${selectedSpot?.id === spot.id ? 'ring-2 ring-brand-500 ring-offset-2' : ''}
                ${spot.isOccupied 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }
              `}
            >
              <span className="text-xs font-bold mb-1">{spot.label}</span>
              {spot.isOccupied ? (
                 <>
                  <Car size={24} fill="currentColor" />
                  {/* Show ticket last 3 digits for quick lookup */}
                  {state.tickets.find(t => t.id === spot.ticketId) && (
                    <span className="absolute bottom-1 text-[10px] font-mono opacity-70">
                      {state.tickets.find(t => t.id === spot.ticketId)?.plate}
                    </span>
                  )}
                 </>
              ) : (
                <span className="text-xs opacity-50">{spot.type}</span>
              )}
            </button>
          ))}
          {filteredSpots.length === 0 && (
             <div className="col-span-full text-center py-8 text-slate-400">
                Nenhuma vaga encontrada com esse termo.
             </div>
          )}
        </div>
      </div>

      {/* Action Panel */}
      <div className="lg:col-span-1">
        <Card className="h-full sticky top-4">
          {!selectedSpot ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
              <Car size={48} className="mb-4 opacity-50" />
              <p>Selecione uma vaga no mapa para registrar entrada ou saída.</p>
            </div>
          ) : !selectedSpot.isOccupied ? (
            <div className="space-y-6">
              <div className="border-b pb-4 dark:border-slate-700">
                <h3 className="text-lg font-bold">Nova Entrada</h3>
                <p className="text-sm text-slate-500">Vaga: {selectedSpot.label}</p>
              </div>
              
              <div className="space-y-4">
                <Input 
                  label="Placa do Veículo" 
                  placeholder="ABC-1234" 
                  value={entryPlate}
                  onChange={e => setEntryPlate(e.target.value)}
                  maxLength={8}
                  autoFocus
                />
                
                <Select 
                  label="Tipo" 
                  value={vehicleType} 
                  onChange={e => setVehicleType(e.target.value as VehicleType)}
                >
                  <option value={VehicleType.CAR}>Carro</option>
                  <option value={VehicleType.MOTO}>Moto</option>
                  <option value={VehicleType.VAN}>Van</option>
                  <option value={VehicleType.TRUCK}>Caminhão</option>
                </Select>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tolerância:</span>
                    <span className="font-mono">{state.settings.rates[vehicleType].toleranceMinutes} min</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                     <span className="text-slate-500">Cobrança Mínima:</span>
                     <span className="font-bold text-lg text-brand-600">R$ {state.settings.rates[vehicleType].firstHour.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full h-12" onClick={handleEntry} disabled={!entryPlate}>
                  Registrar Entrada
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b pb-4 dark:border-slate-700">
                <h3 className="text-lg font-bold text-red-600">Registrar Saída</h3>
                <p className="text-sm text-slate-500">Vaga: {selectedSpot.label} • Ticket #{exitTicket?.id}</p>
              </div>

              {exitTicket && (
                <div className="space-y-4">
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl relative group">
                    <p className="text-sm text-slate-500 mb-1">Valor a Pagar</p>
                    
                    <div className="flex items-center justify-center gap-2">
                       <span className="text-2xl font-bold text-slate-400">R$</span>
                       <input 
                         type="number"
                         value={exitAmount}
                         onChange={(e) => setExitAmount(parseFloat(e.target.value))}
                         className="text-4xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-dashed border-slate-300 w-32 text-center focus:border-brand-500 outline-none"
                         step="0.50"
                       />
                    </div>
                    
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <Clock size={12} /> Permanência: {getDuration(exitTicket.entryTime)}
                    </p>

                    {exitAmount === 0 && (
                      <div className="mt-2 animate-pulse text-xs text-orange-500 font-medium">
                        (Dentro da tolerância)
                      </div>
                    )}
                  </div>

                  {exitAmount === 0 && (
                    <Button variant="secondary" size="sm" className="w-full text-xs" onClick={applyMinFee}>
                      <DollarSign size={14} /> Cobrar Taxa Mínima (R$ {state.settings.rates[exitTicket.vehicleType].firstHour.toFixed(2)})
                    </Button>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                        className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${paymentMethod === PaymentMethod.CASH ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}
                      >
                        <Banknote size={16} /> Dinheiro
                      </button>
                      <button
                        onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
                        className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}
                      >
                        <CreditCard size={16} /> Cartão
                      </button>
                      <button
                        onClick={() => setPaymentMethod(PaymentMethod.PIX)}
                        className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${paymentMethod === PaymentMethod.PIX ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}
                      >
                        <QrCode size={16} /> Pix
                      </button>
                    </div>
                  </div>

                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700" onClick={handleExit}>
                    Confirmar Pagamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Success Modal for Entry */}
      <Modal isOpen={isEntrySuccessOpen} onClose={() => setIsEntrySuccessOpen(false)} title="Entrada Registrada">
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{lastEntryTicket?.plate}</h3>
            <p className="text-slate-500">Ticket #{lastEntryTicket?.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
             <div>
               <p className="text-slate-400">Entrada</p>
               <p className="font-bold">{new Date().toLocaleTimeString()}</p>
             </div>
             <div>
               <p className="text-slate-400">Vaga</p>
               <p className="font-bold">{receiptData?.spotLabel}</p>
             </div>
          </div>
          <Button onClick={handlePrintEntry} className="w-full" size="lg">
            <Printer size={20} /> Imprimir Comprovante
          </Button>
          <Button onClick={() => setIsEntrySuccessOpen(false)} variant="secondary" className="w-full">
            Fechar
          </Button>
        </div>
      </Modal>

      {/* Hidden Print Templates */}
      <div className="print-only">
        {receiptData?.type === 'ENTRY' && (
          <div className="p-4 text-center font-mono text-sm max-w-[300px] mx-auto">
            <h2 className="font-bold text-xl mb-2 uppercase">{receiptData.companyName}</h2>
            <div className="border-b border-black my-2"></div>
            <p className="font-bold text-lg mb-2">COMPROVANTE DE ENTRADA</p>
            
            <div className="text-left space-y-1 my-4">
               <p>TICKET: <strong>{receiptData.ticket.id}</strong></p>
               <p>PLACA: <strong>{receiptData.ticket.plate}</strong></p>
               <p>VAGA: {receiptData.spotLabel}</p>
               <p>ENTRADA: {new Date(receiptData.ticket.entryTime).toLocaleString()}</p>
               <p>TIPO: {receiptData.ticket.vehicleType}</p>
            </div>
            
            {/* Visual Barcode Simulation */}
            <div className="my-4 flex flex-col items-center">
              <div className="h-12 w-48 bg-black"></div>
              <span className="text-xs mt-1">{receiptData.ticket.id}</span>
            </div>
            
            <div className="border-b border-black my-2"></div>
            <p className="text-xs text-justify mt-4 mb-8 leading-tight">
              ESTE TICKET É OBRIGATÓRIO PARA A SAÍDA. 
              NÃO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO VEÍCULO.
              AO ESTACIONAR, VOCÊ CONCORDA COM AS NORMAS DO ESTACIONAMENTO.
            </p>
            <p className="text-xs">Sistema TM Parking Pro</p>
          </div>
        )}

        {receiptData?.type === 'EXIT' && (
           <div className="p-4 text-center font-mono text-sm max-w-[300px] mx-auto">
           <h2 className="font-bold text-xl mb-2 uppercase">{receiptData.companyName}</h2>
           <div className="border-b border-black my-2"></div>
           <p className="font-bold text-lg mb-2">RECIBO DE PAGAMENTO</p>
           
           <div className="text-left space-y-1 my-4">
              <p>TICKET: {receiptData.ticket.id}</p>
              <p>PLACA: <strong>{receiptData.ticket.plate}</strong></p>
              <p>ENTRADA: {new Date(receiptData.ticket.entryTime).toLocaleString()}</p>
              <p>SAÍDA: {new Date(receiptData.exitTime || Date.now()).toLocaleString()}</p>
              <p>PERMANÊNCIA: {Math.ceil(((receiptData.exitTime || Date.now()) - receiptData.ticket.entryTime) / 60000)} min</p>
           </div>
           
           <div className="border-y border-black py-2 my-2 text-xl font-bold">
              TOTAL: R$ {receiptData.amount?.toFixed(2)}
           </div>
           
           <p className="text-xs mt-4">OBRIGADO PELA PREFERÊNCIA!</p>
           <p className="text-[10px] mt-8 text-slate-500">TM Parking Pro • {new Date().toLocaleDateString()}</p>
         </div>
        )}
      </div>
    </div>
  );
};
