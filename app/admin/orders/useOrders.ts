'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { 
  getCache, 
  setCache, 
  hasCache, 
  updateCacheItem,
  type CacheKey 
} from '../lib/adminCache';

const CACHE_KEY: CacheKey = 'orders';

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

// Transform raw data to Order format
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTermOrders, setSearchTermOrders] = useState('');
  const [searchOpenOrders, setSearchOpenOrders] = useState(false);
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch orders with caching - API route üzerinden
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
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
      const response = await fetch('/api/admin/siparisler', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Siparişler alınamadı');
      }

      const { data } = await response.json();
      
      if (data) {
        const transformedOrders = data.map(transformOrderData);
        setOrders(transformedOrders);
        setCache(CACHE_KEY, transformedOrders);
      }
    } catch (error: any) {
      console.error("Siparişler alınamadı:", error.message);
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - uses cache if available
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtered by search
  const searchFilteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchTermOrders.toLowerCase())
  );

  // Filtered by status (Tamamlandı = Sipariş Tamamlandı in DB)
  const filteredOrders = statusFilter === 'all'
    ? searchFilteredOrders
    : searchFilteredOrders.filter((order) => {
        const s = order.status;
        if (statusFilter === 'Tamamlandı') return s === 'Tamamlandı' || s === 'Sipariş Tamamlandı';
        return s === statusFilter;
      });

  // Pagination
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
    // Veritabanından gelen status değerini UI'daki değere çevir
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

    // Status dönüşümü: UI'daki değeri veritabanı değerine çevir
    let dbStatus = editingOrder.status;
    if (editingOrder.status === "Sipariş Tamamlandı") {
      dbStatus = "Tamamlandı";
    }

    const updateData: any = {
      status: dbStatus,
    };

    if (editingOrder.status === "Kirada") {
      updateData.shippingCode =
        editingOrder.shippingCode !== undefined
          ? editingOrder.shippingCode
          : null;
    }

    try {
      const response = await fetch('/api/admin/siparisler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingOrder.id,
          updates: updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('Sipariş güncellenemedi');
      }

      // E-posta gönder (Kirada durumunda)
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

      // Frontend listesini ve cache'i güncelle
      const updatedOrder = { ...editingOrder, ...updateData };
      setOrders((prev) =>
        prev.map((order) =>
          order.id === editingOrder.id ? updatedOrder : order
        )
      );
      
      // Update cache
      updateCacheItem<Order>(CACHE_KEY, editingOrder.id, (item) => ({
        ...item,
        ...updateData,
      }));

      setEditingOrder(null);
      toast.success("Sipariş başarıyla güncellendi ✅");
    } catch (error: any) {
      toast.error("Bir hata oluştu: " + error.message);
    }
  };

  // Force refresh function (for manual refresh)
  const refreshOrders = () => fetchOrders(true);

  return {
    orders,
    filteredOrders,
    currentOrders,
    loading,
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
