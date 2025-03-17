import { Outlet } from 'react-router';
import { useState } from 'react';
import { Navbar } from './navigation/Navbar';
import { Sidebar } from './navigation/Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen dark:bg-gray-900">
      {/* ナビゲーションバー */}
      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex h-full pt-12">
        {/* サイドバー */}
        <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
        
        {/* メインコンテンツ */}
        <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out rounded-none ${sidebarOpen ? 'md:ml-0' : 'md:ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
} 