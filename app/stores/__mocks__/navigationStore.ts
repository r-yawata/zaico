// Mock for the navigationStore

// Mock functions
const setPageTitle = (title: string) => {};
const setBackButton = (show: boolean, callback?: () => void) => {};

// Mock Zustand store
export const useNavigationStore = () => ({
  pageTitle: 'テストタイトル',
  showBackButton: false,
  backButtonCallback: null,
  setPageTitle,
  setBackButton
});
