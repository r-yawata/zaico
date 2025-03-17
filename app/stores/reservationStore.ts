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
    material_id: 1,
    material: {
      id: 1,
      name: 'テスト資材A',
      specification: '規格A',
      category_id: 1,
      category: {
        id: 1,
        name: '原料',
        created_at: new Date(),
        updated_at: new Date()
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    lot: 'LOT20240301',
    usage: 'テスト用途',
    required_amount: new Decimal(10.5),
    outbound_date: today,
    return_date: today,
    test_name: 'テスト1',
    remarks: '当日返却',
    creator_id: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date()
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    material_id: 2,
    material: {
      id: 2,
      name: 'テスト資材B',
      specification: '規格B',
      category_id: 2,
      category: {
        id: 2,
        name: '中間品',
        created_at: new Date(),
        updated_at: new Date()
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    lot: 'LOT20240302',
    usage: 'テスト用途2',
    required_amount: new Decimal(20.0),
    outbound_date: today,
    return_date: tomorrow,
    test_name: 'テスト2',
    remarks: '翌日返却予定',
    creator_id: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date()
    },
    created_at: new Date(),
    updated_at: new Date()
  }
];

interface ReservationState {
  reservations: StockReservation[];
  loading: boolean;
  error: string | null;
  selected_reservation: StockReservation | null;
  fetchReservations: () => Promise<void>;
  addReservation: (reservation: Omit<StockReservation, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReservation: (id: number, reservationData: Partial<StockReservation>) => Promise<void>;
  deleteReservation: (id: number) => Promise<void>;
  selectReservation: (reservation: StockReservation | null) => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: mockReservations,
  loading: false,
  error: null,
  selected_reservation: null,

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
        created_at: new Date(),
        updated_at: new Date()
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
            ? { ...reservation, ...reservationData, updated_at: new Date() } 
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
    set({ selected_reservation: reservation });
  }
})); 