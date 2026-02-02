'use client';

import { useState, useMemo } from 'react';
import { Order } from './useOrders';

interface OrdersTableProps {
  orders: Order[];
  allOrders: Order[]; // Tüm siparişler - gruplama için
  getStatusColor: (status: string) => string;
  onEditOrder: (order: Order) => void;
  onViewOrder: (order: Order) => void;
  searchTerm: string;
  loading?: boolean;
}

// Loading Skeleton Bileşeni
function OrderSkeleton() {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden animate-pulse">
      <div className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="text-right space-y-2 hidden sm:block">
          <div className="h-3 bg-gray-700 rounded w-20"></div>
          <div className="h-5 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

// Müşteri gruplandırma için key oluştur
function getCustomerKey(order: Order): string {
  const name = order.customerName.toLowerCase().trim();
  const phone = order.phone?.toLowerCase().trim() || '';
  const email = order.email?.toLowerCase().trim() || '';
  
  // Email varsa: isim + telefon + email
  // Email yoksa: isim + telefon
  if (email) {
    return `${name}|${phone}|${email}`;
  }
  return `${name}|${phone}`;
}

interface CustomerGroup {
  key: string;
  customerName: string;
  phone: string;
  email: string;
  orders: Order[];
  totalSpent: number;
}

export default function OrdersTable({
  orders,
  allOrders,
  getStatusColor,
  onEditOrder,
  onViewOrder,
  searchTerm,
  loading = false,
}: OrdersTableProps) {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Müşteri gruplarını oluştur - Hook'lar her zaman aynı sırada çağrılmalı
  const customerGroups = useMemo(() => {
    const groupMap = new Map<string, CustomerGroup>();

    // Tüm siparişleri grupla
    allOrders.forEach((order) => {
      const key = getCustomerKey(order);
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          customerName: order.customerName,
          phone: order.phone || '',
          email: order.email || '',
          orders: [],
          totalSpent: 0,
        });
      }
      
      const group = groupMap.get(key)!;
      group.orders.push(order);
      
      // Toplam harcamayı hesapla (Türk formatı: 18.000 veya 18.000,50)
      // Önce noktaları kaldır (binlik ayraç), sonra virgülü noktaya çevir (ondalık ayraç)
      const priceStr = order.price?.toString().replace(/[^\d.,]/g, '') || '0';
      const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.') || '0');
      group.totalSpent += price;
    });

    // Gruplara dönüştür ve filtrele
    let groups = Array.from(groupMap.values());

    // Arama filtresi uygula
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      groups = groups.filter(
        (group) =>
          group.customerName.toLowerCase().includes(term) ||
          group.phone.toLowerCase().includes(term) ||
          group.email.toLowerCase().includes(term)
      );
    }

    // Sipariş sayısına göre sırala (en çok siparişten en aza)
    groups.sort((a, b) => b.orders.length - a.orders.length);

    return groups;
  }, [allOrders, searchTerm]);

  const toggleCustomer = (key: string) => {
    setExpandedCustomers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Toplam sipariş sayısı
  const totalOrderCount = customerGroups.reduce((sum, g) => sum + g.orders.length, 0);

  // Loading durumu - Hook'lardan sonra kontrol edilmeli
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (customerGroups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <i className="ri-inbox-line text-4xl mb-3 block"></i>
        <p>Sipariş bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customerGroups.map((group) => {
        const isExpanded = expandedCustomers.has(group.key);
        
        return (
          <div
            key={group.key}
            className="rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden transition-all"
          >
            {/* Müşteri Kartı Header - Tıklanabilir */}
            <button
              onClick={() => toggleCustomer(group.key)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                  {group.customerName.charAt(0).toUpperCase()}
                </div>

                {/* Müşteri Bilgileri */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white truncate">
                      {group.customerName}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 flex-shrink-0">
                      {group.orders.length} sipariş
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-gray-400">
                    {group.phone && (
                      <span className="flex items-center gap-1 truncate">
                        <i className="ri-phone-line text-xs"></i>
                        {group.phone}
                      </span>
                    )}
                    {group.email && (
                      <span className="flex items-center gap-1 truncate">
                        <i className="ri-mail-line text-xs"></i>
                        {group.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Kısım - Toplam & Chevron */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">Toplam Harcama</p>
                  <p className="font-medium text-green-400">
                    {group.totalSpent.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <i
                  className={`ri-arrow-down-s-line text-xl text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                ></i>
              </div>
            </button>

            {/* Sipariş Listesi - Accordion */}
            {isExpanded && (
              <div className="border-t border-gray-700 bg-gray-900/50">
                <div className="p-3 space-y-2">
                  {group.orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      {/* Sol Kısım - Sipariş Bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-mono text-gray-300">
                            #{order.id.toString().padStart(4, '0')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Ürün</p>
                            <p className="text-gray-300 truncate">{order.productName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Etkinlik Tarihi</p>
                            <p className="text-gray-300">{order.eventDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Fiyat</p>
                            <p className="text-white font-medium">{order.price}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sağ Kısım - Butonlar */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => onEditOrder(order)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white transition-colors"
                          title="Siparişi Düzenle"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => onViewOrder(order)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                          title="Detayları Görüntüle"
                        >
                          <i className="ri-file-list-3-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
