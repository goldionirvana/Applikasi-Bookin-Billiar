export type TableStatus = 'available' | 'occupied' | 'reserved';
export type SessionType = 'open' | 'close';

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  currentSession?: BookingSession;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'food';
  stock: number;
  lowStockThreshold: number;
}

export interface OrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface BookingSession {
  startTime: string;
  customerName: string;
  isMember: boolean;
  memberId?: string;
  tableId: string;
  orders: OrderItem[];
  sessionType: SessionType;
  durationHours?: number; 
}

export interface Reservation {
  id: string;
  tableId: string;
  customerName: string;
  startTime: string;
  phone: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  balance: number;
  points: number;
}

export interface HappyHourRule {
  id: string;
  name: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  discountPercent: number;
  isActive: boolean;
}

export interface PricingSettings {
  hourlyRate: number;
  memberDiscountPercent: number;
  happyHourRules: HappyHourRule[];
}

export interface Transaction {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  isMember: boolean;
  memberId?: string;
  sessionType: SessionType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  hourlyRate: number;
  tablePrice: number;
  ordersPrice: number;
  totalPrice: number;
  pointsEarned: number;
  paymentMethod: 'cash' | 'balance';
  orders: OrderItem[];
  date: string;
  cashierName: string;
  shiftId: string;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  totalRevenue: number;
  transactionsCount: number;
}
