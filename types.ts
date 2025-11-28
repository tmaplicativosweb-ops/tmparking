
export enum VehicleType {
  CAR = 'CAR',
  MOTO = 'MOTO',
  VAN = 'VAN',
  TRUCK = 'TRUCK'
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface RateConfig {
  firstHour: number;
  additionalHour: number;
  toleranceMinutes: number;
}

export interface ParkingSpot {
  id: number;
  label: string;
  type: VehicleType;
  isOccupied: boolean;
  ticketId?: string;
}

export interface Ticket {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  model?: string;
  entryTime: number; // timestamp
  exitTime?: number; // timestamp
  status: TicketStatus;
  spotId?: number;
  totalAmount?: number;
  paymentMethod?: PaymentMethod;
}

export interface Customer {
  id: string;
  name: string;
  plate: string;
  phone: string;
  vehicleType: VehicleType;
  monthlyFee: number;
  dueDate: number; // Day of month
  lastPayment?: number; // timestamp
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  barcode?: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // In a real app, this should be hashed
  role: UserRole;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'PARKING' | 'SUBSCRIPTION' | 'PRODUCT' | 'SALARY' | 'OTHER' | 'STORE_SALE';
  amount: number;
  description: string;
  date: number;
  paymentMethod?: PaymentMethod;
}

export interface License {
  key: string;
  ownerName: string;
  validUntil: number; // timestamp
  isActive: boolean;
  maxSpots: number;
}

export interface AppState {
  tickets: Ticket[];
  spots: ParkingSpot[];
  customers: Customer[];
  transactions: Transaction[];
  products: Product[];
  users: User[]; // Registered users
  settings: {
    rates: Record<VehicleType, RateConfig>;
    companyName: string;
    printerWidth: '58mm' | '80mm';
    darkMode: boolean;
  };
  license: License | null;
  currentUser: {
    isLoggedIn: boolean;
    role: UserRole;
    name: string;
    username: string;
  };
}
