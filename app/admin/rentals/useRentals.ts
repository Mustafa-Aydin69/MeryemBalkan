'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { parseImages } from '@/app/utils/parseImages';
import { toast } from 'sonner';
import {
  getCache,
  setCache,
  hasCache,
  replaceCache,
  type CacheKey,
} from '../lib/adminCache';

const CACHE_KEY: CacheKey = 'rentals';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};
const FALLBACK_IMAGE = '/images/Anasayfa/Meryem_Balkan_Logo.jpg';

// ==================== DATA MODEL ====================
export interface Rental {
  rentalId: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
  };
  rentalPeriod: {
    etkinlikTarihi: string;
    enGecIadeTarihi: string;
  };
  status: 'musteride' | 'gecikti';
  price: number;
  deposit: number;
  createdAt: string;
}

export type RentalStatus = 'all' | 'musteride' | 'gecikti';

// Yeni kiralama formu için tip
export interface NewRentalForm {
  productId: string;
  productName: string;
  productImageUrl: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  etkinlikTarihi: string;
  price: number;
  deposit: number;
}

// Supabase'den gelen sipariş tipi
interface SupabaseOrder {
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

// Supabase'den gelen ürün tipi
interface SupabaseProduct {
  id: number;
  title: string;
  images: string | string[];
}

// ==================== HELPER FUNCTIONS ====================

// Görsel URL'sini parse et
function getImageUrl(images: string | string[] | undefined | null): string {
  if (!images) return FALLBACK_IMAGE;

  const imageArray = parseImages(images);

  if (imageArray.length === 0) return FALLBACK_IMAGE;

  const firstImage = imageArray[0];
  if (!firstImage) return FALLBACK_IMAGE;

  // Tam URL ise direkt kullan
  if (firstImage.startsWith('http')) {
    return firstImage;
  }

  // Değilse base URL ekle
  return getR2BaseUrl() + firstImage;
}

// Müşteri adını ad ve soyad olarak ayır
function parseCustomerName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

// Gecikme durumunu kontrol et (eventDate + 3 gün geçmişse gecikti)
function checkIfOverdue(eventDate: string): boolean {
  if (!eventDate) return false;
  const returnDate = addDays(new Date(eventDate), 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return returnDate < today;
}

// Tarihe gün ekle (ay geçişlerini doğru hesaplar)
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// eventDate + 3 gün hesapla ve string olarak döndür
function calculateReturnDate(eventDate: string): string {
  if (!eventDate) return '';
  const event = new Date(eventDate);
  const returnDate = addDays(event, 3);
  return returnDate.toISOString().split('T')[0];
}

// ==================== HOOK ====================
export function useRentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalStatus>('all');
  const [viewingRental, setViewingRental] = useState<Rental | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Verileri API route üzerinden çek (with caching)
  const fetchRentals = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && hasCache(CACHE_KEY)) {
      const cachedData = getCache<Rental>(CACHE_KEY);
      if (cachedData) {
        setRentals(cachedData);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Kirada olan siparişleri çek
      const ordersResponse = await fetch('/api/admin/siparisler?status=Kirada', {
        credentials: 'include',
      });

      if (!ordersResponse.ok) {
        throw new Error('Siparişler alınamadı');
      }

      const { data: ordersData } = await ordersResponse.json();

      if (!ordersData || ordersData.length === 0) {
        setRentals([]);
        setLoading(false);
        return;
      }

      // 2. Tüm ürünleri çek (productName eşleştirmesi için)
      const productsResponse = await fetch('/api/admin/urunler?fields=id,title,images', {
        credentials: 'include',
      });

      let productsData: SupabaseProduct[] = [];
      if (productsResponse.ok) {
        const productsResult = await productsResponse.json();
        productsData = productsResult.data || [];
      }

      // Ürün map'i oluştur (title -> product)
      const productMap = new Map<string, SupabaseProduct>();
      productsData.forEach((product: SupabaseProduct) => {
        productMap.set(product.title.toLowerCase(), product);
      });

      // 3. Siparişleri Rental formatına dönüştür
      const rentalsData: Rental[] = (ordersData as SupabaseOrder[]).map((order) => {
        // Ürün eşleştirme
        const matchedProduct = productMap.get(order.productName.toLowerCase());
        const imageUrl = matchedProduct
          ? getImageUrl(matchedProduct.images)
          : FALLBACK_IMAGE;

        // Müşteri adını parse et
        const { firstName, lastName } = parseCustomerName(order.customerName);

        // Gecikme kontrolü
        const isOverdue = checkIfOverdue(order.eventDate);

        return {
          rentalId: `KR-${String(order.id).padStart(3, '0')}`,
          product: {
            id: matchedProduct ? `P-${matchedProduct.id}` : `O-${order.id}`,
            name: order.productName,
            imageUrl,
          },
          customer: {
            firstName,
            lastName,
            phone: order.phone || '',
            email: order.email || '',
            address: order.address || '',
          },
          rentalPeriod: {
            etkinlikTarihi: order.eventDate || '',
            enGecIadeTarihi: calculateReturnDate(order.eventDate || ''),
          },
          status: isOverdue ? 'gecikti' : 'musteride',
          price: parseFloat(order.price?.toString().replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.') || '0'),
          deposit: 0,
          createdAt: order.orderDate || new Date().toISOString(),
        };
      });

      setRentals(rentalsData);
      // Update cache
      setCache(CACHE_KEY, rentalsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk yüklemede verileri çek
  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // Filtrelenmiş kiralama listesi
  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      // Status filtresi
      if (statusFilter !== 'all' && rental.status !== statusFilter) {
        return false;
      }

      // Arama filtresi
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesProduct = rental.product.name.toLowerCase().includes(search);
        const matchesCustomer =
          rental.customer.firstName.toLowerCase().includes(search) ||
          rental.customer.lastName.toLowerCase().includes(search) ||
          rental.customer.phone.includes(search);
        return matchesProduct || matchesCustomer;
      }

      return true;
    });
  }, [rentals, searchTerm, statusFilter]);

  // İstatistikler
  const stats = useMemo(() => {
    const aktifKiradakiler = rentals.filter((r) => r.status === 'musteride').length;
    const gecikenIadeler = rentals.filter((r) => r.status === 'gecikti').length;

    return {
      aktifKiradakiler,
      gecikenIadeler,
    };
  }, [rentals]);

  // Durum badge rengi
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'musteride':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'gecikti':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  // Durum label'ı
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'musteride':
        return 'Müşteride';
      case 'gecikti':
        return 'Gecikti';
      default:
        return status;
    }
  };

  // Yeni kiralama oluştur
  const handleCreateRental = async (form: NewRentalForm) => {
    try {
      const response = await fetch('/api/admin/siparisler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerName: `${form.customerFirstName} ${form.customerLastName}`.trim(),
          phone: form.customerPhone,
          email: form.customerEmail,
          address: form.customerAddress,
          productName: form.productName,
          color: '',
          size: '',
          eventDate: form.etkinlikTarihi,
          price: form.price,
          status: 'Kirada',
          paymentMethod: 'Admin',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Kiralama oluşturulamadı');
      }

      await fetchRentals(true);
      setIsCreateModalOpen(false);
      toast.success('Kiralama kaydı oluşturuldu');
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  // Verileri yenile (force refresh)
  const refreshRentals = () => {
    fetchRentals(true);
  };

  // Kiralama tamamlandı olarak işaretle
  const markRentalComplete = async (rentalId: string) => {
    // rentalId formatı: KR-001 -> sipariş ID: 1
    const orderId = parseInt(rentalId.replace('KR-', ''));
    
    try {
      const response = await fetch('/api/admin/siparisler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: orderId,
          updates: { status: 'Tamamlandı' },
        }),
      });

      if (!response.ok) {
        throw new Error('Durum güncellenemedi');
      }

      // Local state'den kaldır ve cache güncelle
      const updatedRentals = rentals.filter((r) => r.rentalId !== rentalId);
      setRentals(updatedRentals);
      replaceCache(CACHE_KEY, updatedRentals);
      
      setViewingRental(null);
      toast.success('Kiralama tamamlandı olarak işaretlendi');
    } catch (error: any) {
      toast.error('Durum güncellenemedi: ' + error.message);
      throw error;
    }
  };

  // Hatırlatma maili gönder
  const sendNotification = async (rental: Rental) => {
    try {
      const response = await fetch('/api/send-rental-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
          customerEmail: rental.customer.email,
          productName: rental.product.name,
          eventDate: rental.rentalPeriod.etkinlikTarihi,
          returnDate: rental.rentalPeriod.enGecIadeTarihi,
          status: rental.status, // 'musteride' veya 'gecikti'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'E-posta gönderilemedi');
      }

      const emailType = data.type === 'overdue' ? 'Gecikme hatırlatması' : 'İade hatırlatması';
      toast.success(`${emailType} gönderildi: ${rental.customer.email}`);
    } catch (error: any) {
      console.error('Hatırlatma maili gönderim hatası:', error);
      toast.error(error.message || 'E-posta gönderilemedi');
    }
  };

  return {
    rentals,
    filteredRentals,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewingRental,
    setViewingRental,
    stats,
    getStatusColor,
    getStatusLabel,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateRental,
    refreshRentals,
    markRentalComplete,
    sendNotification,
  };
}
