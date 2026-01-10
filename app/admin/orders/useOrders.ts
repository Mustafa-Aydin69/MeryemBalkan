'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTermOrders, setSearchTermOrders] = useState('');
  const [searchOpenOrders, setSearchOpenOrders] = useState(false);
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  // Fetch orders
  useEffect(() => {
    async function getOrders() {
      const { data, error } = await supabase
        .from("siparisler")
        .select("id, customerName, address, productName, size, color, eventDate, orderDate, status, price, phone, email, shippingCode");

      if (error) {
        console.error("Siparişler alınamadı:", error.message);
      } else if (data) {
        setOrders(
          data.map((item) => ({
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
            price: item.price,
            shippingCode: item.shippingCode || "",
          }))
        );
      }
    }

    getOrders();
  }, []);

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
        return 'bg-orange-100 text-orange-700';
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-700';
      case 'İptal Edildi':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder({
      ...order,
      originalStatus: order.status,
      shippingCode: order.shippingCode || "",
    });
  };

  const handleOrderInputChange = (field: string, value: string) => {
    setEditingOrder((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    const updateData: any = {
      status: editingOrder.status,
    };

    if (editingOrder.status === "Kargoya Verildi") {
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

    // E-posta gönder (Kargoya Verildi durumunda)
    if (editingOrder.status === "Kargoya Verildi" && editingOrder.shippingCode) {
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

    // Frontend listesini güncelle
    setOrders((prev) =>
      prev.map((order) =>
        order.id === editingOrder.id ? { ...order, ...updateData } : order
      )
    );

    setEditingOrder(null);
    toast.success("Sipariş başarıyla güncellendi ✅");
  };

  const handleGenerateFatura = async (orderId: number) => {
    if (!orderId) {
      toast.error("Fatura oluşturmak için geçerli bir sipariş seçin!");
      return;
    }

    const loading = toast.loading("Fatura oluşturuluyor...");

    try {
      const res = await fetch("/api/generate-fatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        toast.success("Fatura oluşturuldu!");
      } else {
        toast.error("Fatura oluşturulamadı.");
      }
    } catch (error) {
      console.error("Fatura oluşturma hatası:", error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      toast.dismiss(loading);
    }
  };

  return {
    orders,
    filteredOrders,
    currentOrders,
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
    handleGenerateFatura,
  };
}

