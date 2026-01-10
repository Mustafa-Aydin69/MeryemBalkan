'use client';

import { useState, useEffect } from 'react';
import AdminHeader from './layout/AdminHeader';
import AdminTabs from './layout/AdminTabs';
import OrdersPage from './orders/OrdersPage';
import ProductsPage from './products/ProductsPage';
import MessagesPage from './messages/MessagesPage';

type TabType = 'orders' | 'products' | 'messages';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [isClient, setIsClient] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsClient(true);
    // Dark mode'u her zaman aktif et
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const showNavBackground = isClient && scrollY > 100;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 bg-gray-900 ${
          showNavBackground ? 'shadow-lg' : ''
        }`}
      >
        <div className="flex flex-col items-center px-4 md:px-8 py-4 md:py-5">
          <AdminHeader />
          <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-16 px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'orders' && <OrdersPage />}
          {activeTab === 'products' && <ProductsPage />}
          {activeTab === 'messages' && <MessagesPage />}
        </div>
      </main>
    </div>
  );
}
