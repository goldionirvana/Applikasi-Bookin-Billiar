export type TableStatus = 'available' | 'occupied';

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
}

export interface OrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string; // e.g., 'Goreng' or 'Godok'
}

export interface BookingSession {
  startTime: string;
  customerName: string;
  isMember: boolean;
  tableId: string;
  orders: OrderItem[];
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
}

export interface PricingSettings {
  hourlyRate: number;
  memberDiscountPercent: number;
}

export interface Transaction {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  isMember: boolean;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  hourlyRate: number;
  tablePrice: number;
  ordersPrice: number;
  totalPrice: number;
  orders: OrderItem[];
  date: string;
}
