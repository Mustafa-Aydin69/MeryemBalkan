'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import {
  getCache,
  setCache,
  hasCache,
  updateCacheItem,
  removeFromCache,
  invalidateCache,
  type CacheKey
} from '../lib/adminCache';

const CACHE_KEY: CacheKey = 'orders';
const COMPLETED_CACHE_KEY: CacheKey = 'orders_completed';

export interface Order {
  id: number;
  orderId: string;
  conversationId: string;
  customerName: string;
  productName: string;
  size: string;
  color: string;
  eventDate: string;
  orderDate: string;
  status: string;
  phone: string;
  email: string;
  address: string;
  price: string;
  shippingCode: string;
  paymentMethod: string;
}

function transformOrderData(item: any): Order {
  return {
    id: item.id,
    orderId: item.orderId ?? '',
    conversationId: item.conversationId ?? '',
    customerName: item.customerName,
    productName: item.productName,
    size: item.size,
    color: item.color,
    eventDate: item.eventDate,
    orderDate: item.orderDate,
    status: item.status,
    phone: item.phone || "",
    email: item.email || "",
    address: item.address,
    paymentMethod: item.paymentMethod || "Online",
    price: item.price,
    shippingCode: item.shippingCode || "",
  };
}

export function useOrders() {
  // Genel tab (Tamamlandı hariç)
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Tamamlanan tab (lazy)
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedLoaded, setCompletedLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const [searchTermOrders, setSearchTermOrders] = useState('');
  const [searchOpenOrders, setSearchOpenOrders] = useState(false);
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Genel siparişleri çek (Tamamlandı hariç)
  const fetchGeneral = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasCache(CACHE_KEY)) {
      const cachedData = getCache<Order>(CACHE_KEY);
      if (cachedData) {
        setOrders(cachedData);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ excludeStatus: 'Tamamlandı' });
      const response = await fetch(`/api/admin/siparisler?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Siparişler alınamadı');
      const { data } = await response.json();
      if (data) {
        const transformed = data.map(transformOrderData);
        setOrders(transformed);
        setCache(CACHE_KEY, transformed);
      }
    } catch (error: any) {
      console.error("Siparişler alınamadı:", error.message);
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tamamlanan siparişleri çek (lazy)
  const fetchCompleted = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasCache(COMPLETED_CACHE_KEY)) {
      const cachedData = getCache<Order>(COMPLETED_CACHE_KEY);
      if (cachedData) {
        setCompletedOrders(cachedData);
        setCompletedLoaded(true);
        return;
      }
    }
    setCompletedLoading(true);
    try {
      const params = new URLSearchParams({ status: 'Tamamlandı' });
      const response = await fetch(`/api/admin/siparisler?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Tamamlanan siparişler alınamadı');
      const { data } = await response.json();
      if (data) {
        const transformed = data.map(transformOrderData);
        setCompletedOrders(transformed);
        setCache(COMPLETED_CACHE_KEY, transformed);
        setCompletedLoaded(true);
      }
    } catch (error: any) {
      console.error("Tamamlanan siparişler alınamadı:", error.message);
      toast.error('Tamamlanan siparişler yüklenemedi');
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  // Tab değiştir — Tamamlanan ilk kez seçilince lazy fetch tetikler
  const switchTab = useCallback((tab: 0 | 1) => {
    setActiveTab(tab);
    setStatusFilter('all');
    setOrdersCurrentPage(1);
    if (tab === 1 && !completedLoaded) {
      fetchCompleted();
    }
  }, [completedLoaded, fetchCompleted]);

  useEffect(() => {
    fetchGeneral();
  }, [fetchGeneral]);

  const sourceOrders = activeTab === 0 ? orders : completedOrders;
  const isLoading = activeTab === 0 ? loading : completedLoading;

  const searchFilteredOrders = sourceOrders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchTermOrders.toLowerCase())
  );

  const filteredOrders = activeTab === 1 || statusFilter === 'all'
    ? searchFilteredOrders
    : searchFilteredOrders.filter((order) => order.status === statusFilter);

  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = ordersCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handleOrdersPageChange = (pageNumber: number) => {
    setOrdersCurrentPage(pageNumber);
  };

  const getOrdersPaginationNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, ordersCurrentPage - delta); i <= Math.min(totalOrdersPages - 1, ordersCurrentPage + delta); i++) {
      range.push(i);
    }

    if (ordersCurrentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (ordersCurrentPage + delta < totalOrdersPages - 1) {
      rangeWithDots.push('...', totalOrdersPages);
    } else if (totalOrdersPages > 1) {
      rangeWithDots.push(totalOrdersPages);
    }

    return rangeWithDots;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return 'bg-blue-500/20 text-blue-400';
      case 'Kargoya Verildi':
      case 'Kirada':
        return 'bg-orange-500/20 text-orange-400';
      case 'Teslim Edildi':
      case 'Tamamlandı':
      case 'Sipariş Tamamlandı':
        return 'bg-green-500/20 text-green-400';
      case 'İptal Edildi':
        return 'bg-red-500/20 text-red-400';
      case 'Ödeme Yapıyor':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleEditOrder = (order: Order) => {
    let uiStatus = order.status;
    if (order.status === "Tamamlandı") {
      uiStatus = "Sipariş Tamamlandı";
    }
    setEditingOrder({
      ...order,
      status: uiStatus,
      originalStatus: order.status,
      shippingCode: order.shippingCode || "",
    });
  };

  const handleOrderInputChange = (field: string, value: string) => {
    setEditingOrder((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    let dbStatus = editingOrder.status;
    if (editingOrder.status === "Sipariş Tamamlandı") {
      dbStatus = "Tamamlandı";
    }

    const updateData: any = { status: dbStatus };
    if (editingOrder.status === "Kirada") {
      updateData.shippingCode = editingOrder.shippingCode !== undefined
        ? editingOrder.shippingCode
        : null;
    }

    try {
      const response = await fetch('/api/admin/siparisler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: editingOrder.id, updates: updateData }),
      });

      if (!response.ok) throw new Error('Sipariş güncellenemedi');

      if (editingOrder.status === "Kirada" && editingOrder.shippingCode) {
        try {
          await fetch("/api/send-shipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: editingOrder.id,
              customerEmail: editingOrder.email,
              trackingCode: editingOrder.shippingCode,
            }),
          });
        } catch (err) {
          console.error("Mail gönderim hatası:", err);
        }
      }

      if (dbStatus === 'Tamamlandı' && activeTab === 0) {
        // Genel tabda Tamamlandı yapılırsa listeden çıkar
        setOrders(prev => prev.filter(o => o.id !== editingOrder.id));
        removeFromCache(CACHE_KEY, editingOrder.id);
        invalidateCache(COMPLETED_CACHE_KEY);
        setCompletedLoaded(false);
      } else if (activeTab === 1 && dbStatus !== 'Tamamlandı') {
        // Tamamlanan tabda başka statüse alındıysa listeden çıkar
        setCompletedOrders(prev => prev.filter(o => o.id !== editingOrder.id));
        removeFromCache(COMPLETED_CACHE_KEY, editingOrder.id);
        invalidateCache(CACHE_KEY);
      } else {
        const updatedOrder = { ...editingOrder, ...updateData };
        if (activeTab === 0) {
          setOrders(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
          updateCacheItem<Order>(CACHE_KEY, editingOrder.id, (item) => ({ ...item, ...updateData }));
        } else {
          setCompletedOrders(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
          updateCacheItem<Order>(COMPLETED_CACHE_KEY, editingOrder.id, (item) => ({ ...item, ...updateData }));
        }
      }

      setEditingOrder(null);
      toast.success("Sipariş başarıyla güncellendi ✅");
    } catch (error: any) {
      toast.error("Bir hata oluştu: " + error.message);
    }
  };

  const refreshOrders = () => {
    if (activeTab === 0) fetchGeneral(true);
    else fetchCompleted(true);
  };

  return {
    orders,
    filteredOrders,
    currentOrders,
    loading: isLoading,
    completedLoading,
    activeTab,
    switchTab,
    searchTermOrders,
    setSearchTermOrders,
    searchOpenOrders,
    setSearchOpenOrders,
    statusFilter,
    setStatusFilter,
    ordersCurrentPage,
    totalOrdersPages,
    handleOrdersPageChange,
    getOrdersPaginationNumbers,
    getStatusColor,
    editingOrder,
    setEditingOrder,
    handleEditOrder,
    handleOrderInputChange,
    handleUpdateOrder,
    viewingOrder,
    setViewingOrder,
    refreshOrders,
  };
}
