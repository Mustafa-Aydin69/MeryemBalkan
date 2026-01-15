'use client';

type TabType = 'orders' | 'products' | 'messages' | 'rentals';

interface AdminTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function AdminTabs({ activeTab, setActiveTab }: AdminTabsProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'orders', label: 'SİPARİŞLER' },
    { key: 'products', label: 'ÜRÜN YÖNETİMİ' },
    { key: 'rentals', label: 'KİRA YÖNETİMİ' },
    { key: 'messages', label: 'MESAJLAR' },
  ];

  return (
    <div className="flex justify-center space-x-4 sm:space-x-6 md:space-x-8 text-xs sm:text-sm font-medium tracking-wide overflow-x-auto w-full md:w-auto mt-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`cursor-pointer transition-colors font-light pb-2 ${
            activeTab === tab.key
              ? 'border-b-2 border-white text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
