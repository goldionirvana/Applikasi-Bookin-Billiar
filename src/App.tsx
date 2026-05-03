/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Settings, 
  Users, 
  LayoutDashboard, 
  Play, 
  Square, 
  Printer, 
  CircleUser,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  PlusCircle,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from './lib/storage';
import { Table, Member, PricingSettings, Transaction, BookingSession, MenuItem, OrderItem } from './types';
import { differenceInMinutes, format, addMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import Receipt from './components/Receipt';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'settings' | 'history'>('dashboard');
  const [tables, setTables] = useState<Table[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(storage.getMenu());
  const [settings, setSettings] = useState<PricingSettings>(storage.getSettings());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isFinishingModalOpen, setIsFinishingModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // New session state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isMemberSelection, setIsMemberSelection] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [sessionType, setSessionType] = useState<'open' | 'close'>('open');
  const [sessionDuration, setSessionDuration] = useState(1);
  
  // F&B state
  const [selectedFoodVariant, setSelectedFoodVariant] = useState<'Goreng' | 'Godok'>('Goreng');

  // Timer for dashboard updates
  const [refreshTimer, setRefreshTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTimer(prev => prev + 1);
    }, 10000); // Update UI every 10 seconds is enough for the duration display
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTables(storage.getTables());
    setMembers(storage.getMembers());
    setTransactions(storage.getTransactions());
  }, []);

  // Auto-stop logic for close sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tables.forEach(table => {
        if (table.status === 'occupied' && table.currentSession?.sessionType === 'close') {
          const startTime = new Date(table.currentSession.startTime);
          const endTime = addMinutes(startTime, (table.currentSession.durationHours || 0) * 60);
          
          if (now >= endTime) {
            handleStopBooking(table);
          }
        }
      });
    }, 5000); // Check every 5 seconds for immediate response
    return () => clearInterval(interval);
  }, [tables]);

  const saveAll = (newTables: Table[]) => {
    setTables(newTables);
    storage.saveTables(newTables);
  };

  const handleStartBooking = () => {
    if (!selectedTable) return;

    let customerName = newCustomerName;
    let isMember = isMemberSelection;

    if (isMemberSelection && selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) customerName = member.name;
    }

    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'occupied' as const,
          currentSession: {
            startTime: new Date().toISOString(),
            customerName: customerName || 'Guest',
            isMember: isMember,
            tableId: t.id,
            orders: [],
            sessionType: sessionType,
            durationHours: sessionType === 'close' ? sessionDuration : undefined
          }
        };
      }
      return t;
    });

    saveAll(updatedTables);
    setIsBookingModalOpen(false);
    setNewCustomerName('');
    setIsMemberSelection(false);
    setSelectedMemberId('');
    setSessionType('open');
    setSessionDuration(1);
  };

  const handleStopBooking = (table: Table) => {
    if (!table.currentSession) return;

    const startTime = new Date(table.currentSession.startTime);
    let endTime = new Date();
    
    // If it was a close session and reached its limit, use the limit as end time for precision
    if (table.currentSession.sessionType === 'close') {
        const plannedEndTime = addMinutes(startTime, (table.currentSession.durationHours || 0) * 60);
        if (endTime > plannedEndTime) endTime = plannedEndTime;
    }

    const durationMinutes = Math.max(1, differenceInMinutes(endTime, startTime));
    
    let hourlyRate = settings.hourlyRate;
    if (table.currentSession.isMember) {
      hourlyRate = hourlyRate * (1 - settings.memberDiscountPercent / 100);
    }

    const tablePrice = Math.ceil((durationMinutes / 60) * hourlyRate);
    const ordersPrice = table.currentSession.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPrice = tablePrice + ordersPrice;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      tableId: table.id,
      tableName: table.name,
      customerName: table.currentSession.customerName,
      isMember: table.currentSession.isMember,
      sessionType: table.currentSession.sessionType,
      startTime: table.currentSession.startTime,
      endTime: endTime.toISOString(),
      durationMinutes,
      hourlyRate,
      tablePrice,
      ordersPrice,
      totalPrice,
      orders: table.currentSession.orders,
      date: new Date().toISOString()
    };

    const updatedTables = tables.map(t => {
      if (t.id === table.id) {
        return { ...t, status: 'available' as const, currentSession: undefined };
      }
      return t;
    });

    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    storage.saveTransactions(updatedTransactions);
    saveAll(updatedTables);

    setCurrentTransaction(transaction);
    setIsFinishingModalOpen(true);
  };

  const handleAddTable = () => {
    const newTable: Table = {
      id: (tables.length + 1).toString(),
      name: `Table ${tables.length + 1}`,
      status: 'available'
    };
    saveAll([...tables, newTable]);
  };

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      joinDate: new Date().toISOString()
    };
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    storage.saveMembers(updatedMembers);
    e.currentTarget.reset();
  };

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings: PricingSettings = {
      hourlyRate: Number(formData.get('rate')),
      memberDiscountPercent: Number(formData.get('discount')),
    };
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    alert('Pengaturan disimpan!');
  };

  const printReceipt = () => {
    window.print();
  };

  const handleAddOrderItem = (tableId: string, menuItem: MenuItem) => {
    const updatedTables = tables.map(t => {
      if (t.id === tableId && t.currentSession) {
        const existingOrderIndex = t.currentSession.orders.findIndex(o => 
          o.menuId === menuItem.id && o.variant === (menuItem.category === 'food' ? selectedFoodVariant : undefined)
        );

        const newOrders = [...t.currentSession.orders];
        if (existingOrderIndex >= 0) {
          newOrders[existingOrderIndex].quantity += 1;
        } else {
          newOrders.push({
            id: Math.random().toString(36).substr(2, 9),
            menuId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            variant: menuItem.category === 'food' ? selectedFoodVariant : undefined
          });
        }

        return {
          ...t,
          currentSession: {
            ...t.currentSession,
            orders: newOrders
          }
        };
      }
      return t;
    });
    saveAll(updatedTables);
  };

  const BilliardTableVisual = ({ active }: { active: boolean }) => (
    <div className="relative w-full aspect-[2/1] bg-emerald-800 rounded-lg border-8 border-amber-900 shadow-inner overflow-hidden">
      {/* Table Felt texture simulation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
      
      {/* Pockets */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-slate-950 rounded-br-full"></div>
      <div className="absolute top-0 right-0 w-6 h-6 bg-slate-950 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 bg-slate-950 rounded-tr-full"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-slate-950 rounded-tl-full"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-4 bg-slate-950 rounded-b-full"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-4 bg-slate-950 rounded-t-full"></div>

      {/* Balls */}
      {active ? (
        <>
          <motion.div animate={{ x: [0, 10, -5, 0], y: [0, -5, 8, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full shadow-sm shadow-black"></motion.div>
          <motion.div animate={{ x: [0, -8, 4, 0], y: [0, 10, -3, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-1/2 left-2/3 w-3 h-3 bg-red-600 rounded-full shadow-sm shadow-black"></motion.div>
          <motion.div animate={{ x: [0, 5, -12, 0], y: [0, 3, -6, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-yellow-500 rounded-full shadow-sm shadow-black"></motion.div>
          <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-1 w-24 bg-white/20 rotate-45 rounded-full"></div>
          <div className="w-16 h-1 w-24 bg-white/20 -rotate-45 rounded-full"></div>
        </div>
      )}
    </div>
  );
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter(tx => tx.date.startsWith(today));
    const revenue = todayTxs.reduce((sum, tx) => sum + tx.totalPrice, 0);
    return {
      todayRevenue: revenue,
      todayCount: todayTxs.length,
      activeTables: tables.filter(t => t.status === 'occupied').length
    };
  }, [transactions, tables]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/20">
            C
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CueMaster</h1>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'members', icon: Users, label: 'Anggota' },
            { id: 'history', icon: TrendingUp, label: 'Riwayat' },
            { id: 'settings', icon: Settings, label: 'Pengaturan' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 hidden md:block">
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Sesi Aktif</p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {tables.filter(t => t.status === 'occupied').map(t => (
                   <div key={t.id} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                     T{t.id}
                   </div>
                ))}
              </div>
              <span className="text-xl font-bold text-slate-200">{stats.activeTables}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950 p-4 md:p-8 relative">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-blue-500 font-bold text-sm uppercase tracking-widest mb-1">Manajemen Billiard</p>
            <h2 className="text-3xl font-extrabold text-white">
              {activeTab === 'dashboard' && 'Dashboard Meja'}
              {activeTab === 'members' && 'Daftar Anggota'}
              {activeTab === 'history' && 'Riwayat Transaksi'}
              {activeTab === 'settings' && 'Konfigurasi Harga'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400 font-mono text-sm bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
            <Clock size={16} />
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl shadow-black/20">
                <p className="text-slate-500 text-sm font-semibold mb-1">Pendapatan Hari Ini</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-emerald-400">Rp {stats.todayRevenue.toLocaleString('id-ID')}</h3>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full">
                    +{stats.todayCount} Pesanan
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl shadow-black/20">
                <p className="text-slate-500 text-sm font-semibold mb-1">Meja Digunakan</p>
                <h3 className="text-2xl font-bold text-blue-400">{stats.activeTables} / {tables.length}</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-center border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer group" onClick={handleAddTable}>
                <div className="flex flex-col items-center">
                  <PlusCircle className="text-slate-600 group-hover:text-blue-500 mb-1" size={24} />
                  <p className="text-slate-500 group-hover:text-blue-500 font-bold text-sm">Tambah Meja</p>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tables.map(table => (
                <motion.div
                  layout
                  key={table.id}
                  className={`relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-[2rem] border-2 shadow-2xl ${
                    table.status === 'occupied' 
                      ? 'bg-blue-600/10 border-blue-600/50' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                  }`}
                  onClick={() => {
                    if (table.status === 'available') {
                      setSelectedTable(table);
                      setIsBookingModalOpen(true);
                    }
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        table.status === 'occupied' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {table.status === 'occupied' 
                          ? (table.currentSession?.sessionType === 'close' ? 'Close Table' : 'Open Table') 
                          : 'Tersedia'}
                      </div>
                      <div className="text-slate-500 font-black text-xs">#{table.id}</div>
                    </div>

                    <div className="mb-6">
                      <BilliardTableVisual active={table.status === 'occupied'} />
                    </div>

                    <h3 className="text-xl font-bold mb-1 text-white">{table.name}</h3>
                    
                    {table.status === 'occupied' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">Pemain</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-semibold truncate max-w-[100px] text-sm">{table.currentSession?.customerName}</span>
                              {table.currentSession?.isMember && (
                                <span className="px-1 py-0.5 bg-yellow-400/20 text-yellow-500 text-[8px] font-black rounded border border-yellow-500/30">VIP</span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTable(table);
                              setIsOrderModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                          >
                            <Plus size={12} />
                            F&B
                          </button>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock size={12} className="text-blue-500" />
                              <span className="text-xs font-mono font-bold">
                                {format(new Date(table.currentSession?.startTime || ''), 'HH:mm')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({differenceInMinutes(new Date(), new Date(table.currentSession?.startTime || ''))}m)
                              </span>
                            </div>
                            {table.currentSession?.sessionType === 'close' && (
                              <p className="text-[10px] font-bold text-red-400 mt-0.5">
                                Limit: {table.currentSession.durationHours} Jam 
                                <span className="ml-1 opacity-70">
                                  ({Math.max(0, (table.currentSession.durationHours || 0) * 60 - differenceInMinutes(new Date(), new Date(table.currentSession.startTime)))}m left)
                                </span>
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStopBooking(table);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Square size={10} fill="currentColor" />
                            STOP
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 opacity-40 group-hover:opacity-100 transition-opacity">
                         <Play size={20} className="text-blue-500 mb-1" fill="currentColor" />
                         <span className="text-blue-400 text-[10px] font-black">TAB TO START</span>
                      </div>
                    )}
                  </div>

                  {/* Aesthetic Corner Ball */}
                  <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-10 transition-transform group-hover:scale-125 ${
                    table.status === 'occupied' ? 'bg-blue-600' : 'bg-white'
                  }`}></div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="max-w-4xl space-y-6">
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-800 mb-6">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2">Nama Lengkap</label>
                    <input name="name" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: John Doe" />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2">Nomor Telepon</label>
                    <input name="phone" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="0812xxxx" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                      Tambah Anggota
                    </button>
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase font-black border-b border-slate-800">
                        <th className="py-4 px-2">Nama</th>
                        <th className="py-4">Telepon</th>
                        <th className="py-4">Tanggal Bergabung</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {members.map(member => (
                        <tr key={member.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-4 px-2 font-semibold">{member.name}</td>
                          <td className="py-4 font-mono text-sm">{member.phone}</td>
                          <td className="py-4 text-xs text-slate-500">
                            {format(new Date(member.joinDate), 'dd MMM yyyy')}
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-slate-600 italic">Belum ada anggota terdaftar</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl space-y-4">
             {transactions.map(tx => (
               <div key={tx.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <TableIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{tx.tableName} <span className="text-slate-500 font-normal">({tx.customerName})</span></h4>
                      <div className="flex gap-3 text-[10px] uppercase font-bold tracking-widest mt-1 text-slate-500">
                         <span>{format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}</span>
                         <span className="w-px h-3 bg-slate-700"></span>
                         <span>{tx.durationMinutes} menit</span>
                      </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-xl font-bold text-white tracking-tighter">Rp {tx.totalPrice.toLocaleString('id-ID')}</p>
                       <p className={`text-[10px] font-black uppercase ${tx.isMember ? 'text-yellow-500' : 'text-slate-500'}`}>
                         {tx.isMember ? 'MEMBER' : 'REGULER'}
                       </p>
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentTransaction(tx);
                        setIsFinishingModalOpen(true);
                      }}
                      className="p-2 bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                    >
                      <Printer size={20} />
                    </button>
                 </div>
               </div>
             ))}
             {transactions.length === 0 && (
               <div className="py-20 text-center text-slate-600 italic flex flex-col items-center">
                 <TrendingUp size={48} className="mb-4 opacity-20" />
                 Belum ada transaksi tersimpan
               </div>
             )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl">
             <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Harga Per Jam (Rp)</label>
                        <input name="rate" type="number" defaultValue={settings.hourlyRate} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Diskon Member (%)</label>
                        <input name="discount" type="number" defaultValue={settings.memberDiscountPercent} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-2xl font-bold text-yellow-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                     <Settings size={20} /> SIMPAN PERUBAHAN
                   </button>
                </form>
                
                <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tarif Reguler</span>
                    <span className="font-bold text-white">Rp {settings.hourlyRate.toLocaleString('id-ID')} / Jam</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tarif Member</span>
                    <span className="font-bold text-emerald-400">Rp {(settings.hourlyRate * (1 - settings.memberDiscountPercent/100)).toLocaleString('id-ID')} / Jam</span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {isBookingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white italic">START SESSION</h3>
                  <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                       {selectedTable?.id}
                     </div>
                     <div>
                       <p className="text-slate-500 text-[10px] font-bold uppercase">Meja Dipilih</p>
                       <p className="text-white font-bold">{selectedTable?.name}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex p-1 bg-slate-800 rounded-xl">
                      <button 
                        onClick={() => setSessionType('open')}
                        className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${sessionType === 'open' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                      >
                        OPEN TABLE
                      </button>
                      <button 
                        onClick={() => setSessionType('close')}
                        className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${sessionType === 'close' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
                      >
                        CLOSE TABLE
                      </button>
                    </div>

                    {sessionType === 'close' && (
                      <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-3">Durasi (Kelipatan 1 Jam)</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(h => (
                            <button
                              key={h}
                              onClick={() => setSessionDuration(h)}
                              className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${sessionDuration === h ? 'bg-red-500 border-red-400 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                            >
                              {h} H
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex p-1 bg-slate-800 rounded-xl">
                      <button 
                        onClick={() => setIsMemberSelection(false)}
                        className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${!isMemberSelection ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                      >
                        REGULER
                      </button>
                      <button 
                        onClick={() => setIsMemberSelection(true)}
                        className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${isMemberSelection ? 'bg-yellow-500 text-slate-900 shadow-lg' : 'text-slate-400'}`}
                      >
                        MEMBER VIP
                      </button>
                    </div>

                    {isMemberSelection ? (
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2">Pilih Anggota</label>
                        <select 
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-bold"
                        >
                          <option value="">-- Pilih Member --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        {members.length === 0 && <p className="text-[10px] text-red-500 mt-2 italic">* Belum ada member terdaftar</p>}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2">Nama Pelanggan (Opsional)</label>
                        <input 
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" 
                          placeholder="Masukkan nama guest..."
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleStartBooking}
                    className="w-full bg-slate-100 text-slate-900 hover:bg-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2"
                  >
                    MULAI PERMAINAN <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isOrderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOrderModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white italic">F&B ORDERS</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase">{selectedTable?.name} - {selectedTable?.currentSession?.customerName}</p>
                  </div>
                  <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-6 overflow-hidden">
                  {/* Menu List */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-l-2 border-blue-500 pl-2">DRINKS</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {menu.filter(m => m.category === 'drink').map(item => (
                          <button 
                            key={item.id}
                            onClick={() => handleAddOrderItem(selectedTable!.id, item)}
                            className="bg-slate-800 hover:bg-blue-600 transition-colors p-3 rounded-xl text-left border border-slate-700/50"
                          >
                            <p className="text-xs font-bold text-white mb-1">{item.name}</p>
                            <p className="text-[10px] text-blue-400 font-mono">Rp {item.price.toLocaleString('id-ID')}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-2">FOOD</h4>
                      <div className="mb-4 bg-slate-800 p-2 rounded-xl flex gap-2">
                         <button 
                          onClick={() => setSelectedFoodVariant('Goreng')}
                          className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${selectedFoodVariant === 'Goreng' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                         >GORENG</button>
                         <button 
                          onClick={() => setSelectedFoodVariant('Godok')}
                          className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${selectedFoodVariant === 'Godok' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                         >GODOK</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {menu.filter(m => m.category === 'food').map(item => (
                          <button 
                            key={item.id}
                            onClick={() => handleAddOrderItem(selectedTable!.id, item)}
                            className="bg-slate-800 hover:bg-emerald-600 transition-colors p-3 rounded-xl text-left border border-slate-700/50"
                          >
                            <p className="text-xs font-bold text-white mb-1">{item.name}</p>
                            <p className="text-[10px] text-emerald-400 font-mono">Rp {item.price.toLocaleString('id-ID')}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Current Orders Summary */}
                  <div className="w-64 bg-slate-950/50 rounded-2xl border border-slate-800 p-4 flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">PESANAN SAAT INI</h4>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {selectedTable?.id && tables.find(t => t.id === selectedTable.id)?.currentSession?.orders.map(order => (
                        <div key={order.id} className="flex justify-between items-start border-b border-slate-800 pb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-200">{order.quantity}x {order.name}</p>
                            {order.variant && <p className="text-[9px] text-slate-500 italic">{order.variant}</p>}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400">{(order.price * order.quantity).toLocaleString('id-ID')}</p>
                        </div>
                      ))}
                      {(!selectedTable?.id || (tables.find(t => t.id === selectedTable.id)?.currentSession?.orders.length === 0)) && (
                        <p className="text-center text-slate-700 text-[10px] italic py-10">Belum ada pesanan</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-800 mt-4">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold text-slate-500">TOTAL</span>
                          <span className="text-sm font-black text-white">
                            Rp {tables.find(t => t.id === selectedTable?.id)?.currentSession?.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}
                          </span>
                       </div>
                       <button onClick={() => setIsOrderModalOpen(false)} className="w-full bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-xs uppercase">Selesai</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {isFinishingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFinishingModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-sm"
              >
                <div className="overflow-hidden rounded-3xl mb-4">
                  {currentTransaction && <Receipt transaction={currentTransaction} settings={settings} />}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={printReceipt}
                    className="bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30"
                  >
                    <Printer size={20} /> CETAK
                  </button>
                  <button 
                    onClick={() => setIsFinishingModalOpen(false)}
                    className="bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-700"
                  >
                    SELESAI
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
