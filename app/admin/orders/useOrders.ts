'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  getCache, 
  setCache, 
  hasCache, 
  updateCacheItem,
  type CacheKey 
} from '../lib/adminCache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_KEY: CacheKey = 'orders';

export interface Order {
  id: number;
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

  // Fetch orders with caching
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
    
    const { data, error } = await supabase
      .from("siparisler")
      .select("id, customerName, address, productName, size, color, eventDate, orderDate, status, price, phone, email, shippingCode, paymentMethod");

    if (error) {
      console.error("Siparişler alınamadı:", error.message);
      setLoading(false);
    } else if (data) {
      const transformedOrders = data.map(transformOrderData);
      setOrders(transformedOrders);
      // Update cache
      setCache(CACHE_KEY, transformedOrders);
      setLoading(false);
    }
  }, []);

  // Initial fetch - uses cache if available
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtered orders
  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchTermOrders.toLowerCase())
  );

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
        return 'bg-blue-100 text-blue-700';
      case 'Kargoya Verildi':
      case 'Kirada':
        return 'bg-orange-100 text-orange-700';
      case 'Teslim Edildi':
      case 'Tamamlandı':
      case 'Sipariş Tamamlandı':
        return 'bg-green-100 text-green-700';
      case 'İptal Edildi':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

    console.log("🟩 Supabase'e gönderilen:", updateData);

    const { data, error } = await supabase
      .from("siparisler")
      .update(updateData)
      .eq("id", editingOrder.id)
      .select();

    if (error) {
      console.error("Sipariş güncellenemedi:", error.message);
      alert("Bir hata oluştu: " + error.message);
      return;
    }

    // E-posta gönder (Kirada durumunda)
    if (editingOrder.status === "Kirada" && editingOrder.shippingCode) {
      try {
        console.log("📦 Kargo maili gönderiliyor...");

        await fetch("/api/send-shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: editingOrder.id,
            customerEmail: editingOrder.email,
            trackingCode: editingOrder.shippingCode,
          }),
        });

        console.log("✅ Kargo maili gönderildi.");
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

