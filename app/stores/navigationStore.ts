import { create } from 'zustand';

interface NavigationState {
  // 現在のページタイトル
  pageTitle: string;
  // 戻るボタンを表示するかどうか
  showBackButton: boolean;
  // 戻るボタンが押されたときのコールバック関数
  backButtonCallback: (() => void) | null;
  
  // ページタイトルを設定するアクション
  setPageTitle: (title: string) => void;
  // 戻るボタンの表示状態とコールバックを設定するアクション
  setBackButton: (show: boolean, callback?: () => void) => void;
  // ナビゲーション状態をリセットするアクション
  resetNavigation: () => void;
}

// ナビゲーション情報を管理するストアを作成
export const useNavigationStore = create<NavigationState>((set) => ({
  // 初期状態
  pageTitle: 'StockBox',
  showBackButton: false,
  backButtonCallback: null,
  
  // ページタイトルを設定するアクション
  setPageTitle: (title: string) => set({ pageTitle: title }),
  
  // 戻るボタンの表示状態とコールバックを設定するアクション
  setBackButton: (show: boolean, callback?: () => void) => set({ 
    showBackButton: show,
    backButtonCallback: callback || null
  }),
  
  // ナビゲーション状態をリセットするアクション
  resetNavigation: () => set({ 
    pageTitle: 'StockBox',
    showBackButton: false,
    backButtonCallback: null
  }),
})); 