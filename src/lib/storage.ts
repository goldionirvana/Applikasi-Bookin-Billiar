import { Table, Member, PricingSettings, Transaction, MenuItem, Shift, Reservation } from '../types';

const STORAGE_KEYS = {
  TABLES: 'cue_master_tables',
  MEMBERS: 'cue_master_members',
  SETTINGS: 'cue_master_settings',
  TRANSACTIONS: 'cue_master_transactions',
  MENU: 'cue_master_menu',
  SHIFTS: 'cue_master_shifts',
  RESERVATIONS: 'cue_master_reservations',
  CURRENT_SHIFT: 'cue_master_active_shift',
};

const DEFAULT_SETTINGS: PricingSettings = {
  hourlyRate: 50000,
  memberDiscountPercent: 20,
  happyHourRules: [
    { id: '1', name: 'Siang Hemat', startHour: 10, endHour: 14, discountPercent: 30, isActive: true }
  ]
};

const DEFAULT_TABLES: Table[] = [
  { id: '1', name: 'Table 1', status: 'available' },
  { id: '2', name: 'Table 2', status: 'available' },
  { id: '3', name: 'Table 3', status: 'available' },
  { id: '4', name: 'Table 4', status: 'available' },
];

const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Matcha', price: 15000, category: 'drink', stock: 50, lowStockThreshold: 5 },
  { id: 'm2', name: 'Red Velvet', price: 15000, category: 'drink', stock: 50, lowStockThreshold: 5 },
  { id: 'm3', name: 'Kopi Hitam', price: 8000, category: 'drink', stock: 100, lowStockThreshold: 10 },
  { id: 'm4', name: 'Extra Joss', price: 5000, category: 'drink', stock: 100, lowStockThreshold: 10 },
  { id: 'm5', name: 'Susu', price: 7000, category: 'drink', stock: 50, lowStockThreshold: 5 },
  { id: 'm6', name: 'Joshua', price: 12000, category: 'drink', stock: 50, lowStockThreshold: 5 },
  { id: 'f1', name: 'Mie Instan', price: 10000, category: 'food', stock: 100, lowStockThreshold: 10 },
  { id: 'f2', name: 'Mie Instan Double', price: 18000, category: 'food', stock: 100, lowStockThreshold: 10 },
  { id: 'f3', name: 'Mie Instan + Telor', price: 15000, category: 'food', stock: 100, lowStockThreshold: 10 },
  { id: 'f4', name: 'Mie Instan Double + Telor', price: 23000, category: 'food', stock: 100, lowStockThreshold: 10 },
];

export const storage = {
  getTables: (): Table[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TABLES);
    return data ? JSON.parse(data) : DEFAULT_TABLES;
  },
  saveTables: (tables: Table[]) => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  },
  
  getMembers: (): Member[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return data ? JSON.parse(data) : [];
  },
  saveMembers: (members: Member[]) => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  },

  getSettings: (): PricingSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : DEFAULT_SETTINGS;
    // Ensure nested happy hour is present for backward compatibility
    if (!parsed.happyHourRules) parsed.happyHourRules = DEFAULT_SETTINGS.happyHourRules;
    return parsed;
  },
  saveSettings: (settings: PricingSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getMenu: (): MenuItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MENU);
    return data ? JSON.parse(data) : DEFAULT_MENU;
  },
  saveMenu: (menu: MenuItem[]) => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
  },

  getShifts: (): Shift[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return data ? JSON.parse(data) : [];
  },
  saveShifts: (shifts: Shift[]) => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  },

  getActiveShift: (): Shift | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT);
    return data ? JSON.parse(data) : null;
  },
  saveActiveShift: (shift: Shift | null) => {
    if (shift) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(shift));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT);
    }
  },

  getReservations: (): Reservation[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return data ? JSON.parse(data) : [];
  },
  saveReservations: (res: Reservation[]) => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(res));
  }
};
