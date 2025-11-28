
import { AppState, VehicleType, UserRole, License } from '../types';

const STORAGE_KEY = 'tm_parking_pro_db_v2';

const INITIAL_RATES = {
  firstHour: 10,
  additionalHour: 5,
  toleranceMinutes: 0 // Changed to 0 for immediate charging during tests
};

const DEFAULT_STATE: AppState = {
  tickets: [],
  spots: Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    label: `V-${i + 1}`,
    type: i < 5 ? VehicleType.MOTO : VehicleType.CAR,
    isOccupied: false
  })),
  customers: [],
  transactions: [],
  products: [
    { id: '1', name: 'Água Mineral 500ml', price: 4.00, cost: 1.50, stock: 50, category: 'Bebidas' },
    { id: '2', name: 'Refrigerante Lata', price: 6.00, cost: 2.50, stock: 30, category: 'Bebidas' },
    { id: '3', name: 'Salgadinho', price: 5.00, cost: 2.00, stock: 20, category: 'Snacks' },
    { id: '4', name: 'Café Expresso', price: 3.50, cost: 0.80, stock: 100, category: 'Bebidas' },
  ],
  users: [
    { id: '1', name: 'Administrador', username: 'admin', password: 'admin123', role: UserRole.ADMIN }
  ],
  settings: {
    rates: {
      [VehicleType.CAR]: { ...INITIAL_RATES },
      [VehicleType.MOTO]: { firstHour: 5, additionalHour: 3, toleranceMinutes: 0 },
      [VehicleType.VAN]: { firstHour: 15, additionalHour: 8, toleranceMinutes: 0 },
      [VehicleType.TRUCK]: { firstHour: 25, additionalHour: 15, toleranceMinutes: 0 },
    },
    companyName: 'TM Parking',
    printerWidth: '80mm',
    darkMode: false,
  },
  license: null,
  currentUser: {
    isLoggedIn: false,
    role: UserRole.ADMIN,
    name: '',
    username: ''
  }
};

export const StorageService = {
  load: (): AppState => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Migration safety: ensure new fields exist if loading old data
        if (!parsed.products) parsed.products = DEFAULT_STATE.products;
        if (!parsed.users) parsed.users = DEFAULT_STATE.users;
        return parsed;
      }
    } catch (e) {
      console.error('Error loading data', e);
    }
    return DEFAULT_STATE;
  },

  save: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  // --- Business Logic Helpers ---

  calculateFee: (entryTime: number, exitTime: number, vehicleType: VehicleType, rates: any) => {
    const rate = rates[vehicleType];
    const durationMs = exitTime - entryTime;
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));

    // If tolerance is 0, we charge immediately (durationMinutes is at least 1 if rounded up, or check explicitly)
    if (rate.toleranceMinutes > 0 && durationMinutes <= rate.toleranceMinutes) return 0;

    let total = rate.firstHour;
    
    // Logic: First hour is fixed. If duration > 60, we add additional hours.
    // Example: 61 min -> 1st hour + 1 extra hour
    if (durationMinutes > 60) {
      const extraMinutes = durationMinutes - 60;
      const extraHours = Math.ceil(extraMinutes / 60);
      total += extraHours * rate.additionalHour;
    }
    
    return parseFloat(total.toFixed(2));
  },

  generateLicense: (owner: string, days: number = 30): License => {
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const datePart = Date.now().toString(36).toUpperCase().substr(-4);
    
    return {
      key: `TM-PRO-${randomPart}-${datePart}`, // Format: TM-PRO-XXXXXX-YYYY
      ownerName: owner,
      validUntil: Date.now() + (1000 * 60 * 60 * 24 * days),
      isActive: true,
      maxSpots: 100
    };
  }
};
