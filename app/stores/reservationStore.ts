import { create } from 'zustand';
import { Decimal } from 'decimal.js';
import type { StockReservation } from '../types';

// 日付の作成
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// モックデータ
const mockReservations: StockReservation[] = [
  {
    id: 1,
    materialId: 1,
    material: {
      id: 1,
      name: 'テスト資材A',
      specification: '規格A',
      categoryId: 1,
      category: {
        id: 1,
        name: '原料',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    lot: 'LOT20240301',
    usage: 'テスト用途',
    requiredAmount: new Decimal(10.5),
    outboundDate: today,
    returnDate: today,
    testName: 'テスト1',
    remarks: '当日返却',
    creatorId: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    materialId: 2,
    material: {
      id: 2,
      name: 'テスト資材B',
      specification: '規格B',
      categoryId: 2,
      category: {
        id: 2,
        name: '中間品',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    lot: 'LOT20240302',
    usage: 'テスト用途2',
    requiredAmount: new Decimal(20.0),
    outboundDate: today,
    returnDate: tomorrow,
    testName: 'テスト2',
    remarks: '翌日返却予定',
    creatorId: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface ReservationState {
  reservations: StockReservation[];
  loading: boolean;
  error: string | null;
  selectedReservation: StockReservation | null;
  fetchReservations: () => Promise<void>;
  addReservation: (reservation: Omit<StockReservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReservation: (id: number, reservationData: Partial<StockReservation>) => Promise<void>;
  deleteReservation: (id: number) => Promise<void>;
  selectReservation: (reservation: StockReservation | null) => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: mockReservations,
  loading: false,
  error: null,
  selectedReservation: null,

  fetchReservations: async () => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      set({ reservations: mockReservations, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addReservation: async (reservation) => {
    set({ loading: true, error: null });
    try {
      const newReservation: StockReservation = {
        ...reservation,
        id: Math.max(0, ...get().reservations.map(r => r.id)) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set(state => ({ 
        reservations: [...state.reservations, newReservation], 
        loading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateReservation: async (id, reservationData) => {
    set({ loading: true, error: null });
    try {
      set(state => ({
        reservations: state.reservations.map(reservation => 
          reservation.id === id 
            ? { ...reservation, ...reservationData, updatedAt: new Date() } 
            : reservation
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteReservation: async (id) => {
    set({ loading: true, error: null });
    try {
      set(state => ({
        reservations: state.reservations.filter(reservation => reservation.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  selectReservation: (reservation) => {
    set({ selectedReservation: reservation });
  }
})); 