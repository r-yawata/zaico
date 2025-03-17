import React from 'react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useUserSessionStore } from '../../stores/userSessionStore';

interface NavbarProps {
  toggleSidebar: () => void;
}

export function Navbar({ toggleSidebar }: NavbarProps) {
  // ナビゲーションストアから状態を取得
  const { pageTitle, showBackButton, backButtonCallback } = useNavigationStore();
  
  // ユーザーセッションストアから状態を取得
  const { username, isLoggedIn, logout } = useUserSessionStore();

  // 戻るボタンがクリックされたときの処理
  const handleBackClick = () => {
    if (backButtonCallback) {
      backButtonCallback();
    }
  };
  
  // ログアウトボタンがクリックされたときの処理
  const handleLogout = () => {
    logout();
    // 必要に応じてリダイレクトなどの追加処理
  };

  return (
    <header className="fixed top-0 left-0 w-full h-12 bg-white flex justify-between items-center px-4 z-50 text-[#555555] shadow-md">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
          aria-label="メニューを開く"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          </svg>
        </button>

        {/* 戻るボタン - showBackButtonがtrueの場合のみ表示 */}
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none ml-2"
            aria-label="戻る"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-9 w-9"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* ページタイトル - Zustandストアから取得 */}
        <h1 className="ml-4 text-lg">{pageTitle}</h1>
      </div>
      
      {/* 中央にソフトロゴを追加 */}
      <div className="flex items-center">
        <h1 className="ml-4 text-lg">ZaicoBox</h1>
        {/* <img src="/softlogo.png" alt="ソフトロゴ" className="w-10 h-10" /> */}
      </div>
      
      <div className="flex items-center">
        {/* ユーザー名表示 - ログイン時のみ表示 */}
        {isLoggedIn && (
          <h1 className="ml-4 text-lg mr-4">{username}</h1>
        )}
        
        {/* ログアウトボタン - ログイン時のみ表示 */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="ログアウト"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
} 