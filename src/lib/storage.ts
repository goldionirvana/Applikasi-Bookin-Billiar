import { Table, Member, PricingSettings, Transaction, MenuItem } from '../types';

const STORAGE_KEYS = {
  TABLES: 'cue_master_tables',
  MEMBERS: 'cue_master_members',
  SETTINGS: 'cue_master_settings',
  TRANSACTIONS: 'cue_master_transactions',
  MENU: 'cue_master_menu',
};

const DEFAULT_SETTINGS: PricingSettings = {
  hourlyRate: 50000,
  memberDiscountPercent: 20,
};

const DEFAULT_TABLES: Table[] = [
  { id: '1', name: 'Table 1', status: 'available' },
  { id: '2', name: 'Table 2', status: 'available' },
  { id: '3', name: 'Table 3', status: 'available' },
  { id: '4', name: 'Table 4', status: 'available' },
];

const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Matcha', price: 15000, category: 'drink' },
  { id: 'm2', name: 'Red Velvet', price: 15000, category: 'drink' },
  { id: 'm3', name: 'Kopi Hitam', price: 8000, category: 'drink' },
  { id: 'm4', name: 'Extra Joss', price: 5000, category: 'drink' },
  { id: 'm5', name: 'Susu', price: 7000, category: 'drink' },
  { id: 'm6', name: 'Joshua', price: 12000, category: 'drink' },
  { id: 'f1', name: 'Mie Instan', price: 10000, category: 'food' },
  { id: 'f2', name: 'Mie Instan Double', price: 18000, category: 'food' },
  { id: 'f3', name: 'Mie Instan + Telor', price: 15000, category: 'food' },
  { id: 'f4', name: 'Mie Instan Double + Telor', price: 23000, category: 'food' },
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
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
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
  }
};
