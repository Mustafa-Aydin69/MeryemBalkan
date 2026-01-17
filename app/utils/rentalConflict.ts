import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Engelleme durumları
const BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada', 'Ödeme Yapıyor'];

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  color: string;
  size: string;
  date: string;
  image: string;
}

interface ConflictResult {
  item: CartItem;
  reason: string;
}

interface CheckResult {
  hasConflict: boolean;
  conflicts: ConflictResult[];
  validItems: CartItem[];
}

/**
 * Tarih aralığı hesapla (±7 gün)
 */
function getDateRange(dateStr: string): { startDate: string; endDate: string } {
  const date = new Date(dateStr);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 7);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Ürünün yayında olup olmadığını kontrol et
 */
export async function checkProductStatus(productId: string): Promise<{ isActive: boolean; productName: string | null }> {
  try {
    // productId format: "5_Altın_Sarısı_36_2025-10-22" → "5"
    const realId = String(productId).split('_')[0];
    const parsedId = parseInt(realId, 10);
    
    // ID geçersizse
    if (isNaN(parsedId)) {
      return { isActive: false, productName: null };
    }
    
    const { data, error } = await supabase
      .from('urunler')
      .select('status, title')
      .eq('id', parsedId)
      .single();
    
    if (error || !data) {
      return { isActive: false, productName: null };
    }
    
    // "Yayında" durumunu kontrol et
    const isActive = data.status === 'Yayında';
    
    return { isActive, productName: data.title };
  } catch (err) {
    return { isActive: false, productName: null };
  }
}

/**
 * Tek bir ürün için çakışma kontrolü yap
 */
export async function checkSingleConflict(productName: string, eventDate: string): Promise<{ hasConflict: boolean; reason: string }> {
  const { startDate, endDate } = getDateRange(eventDate);
  
  const { data, error } = await supabase
    .from('siparisler')
    .select('id, eventDate, status')
    .eq('productName', productName)
    .in('status', BLOCKING_STATUSES)
    .gte('eventDate', startDate)
    .lte('eventDate', endDate);
  
  if (error) {
    console.error('Çakışma kontrolü hatası:', error);
    return { hasConflict: false, reason: '' };
  }
  
  if (data && data.length > 0) {
    return {
      hasConflict: true,
      reason: `Bu elbise istediğiniz tarihte başka bir müşteri tarafından kiralanmıştır. Lütfen farklı bir tarih seçiniz.`
    };
  }
  
  return { hasConflict: false, reason: '' };
}

/**
 * Sepetteki tüm ürünler için çakışma kontrolü yap
 */
export async function checkCartConflicts(cartItems: CartItem[]): Promise<CheckResult> {
  const conflicts: ConflictResult[] = [];
  const validItems: CartItem[] = [];
  
  for (const item of cartItems) {
    // 1. Ürün yayında mı kontrol et
    const { isActive, productName } = await checkProductStatus(item.productId);
    
    if (!isActive) {
      conflicts.push({
        item,
        reason: `"${item.title}" ürünü artık mevcut değil veya yayından kaldırılmış.`
      });
      continue;
    }
    
    // 2. Tarih çakışması var mı kontrol et
    const titleToCheck = productName || item.title;
    const { hasConflict, reason } = await checkSingleConflict(titleToCheck, item.date);
    
    if (hasConflict) {
      conflicts.push({ item, reason });
    } else {
      validItems.push(item);
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    validItems
  };
}

/**
 * Siparişleri "Ödeme Yapıyor" durumu ile kaydet
 */
export async function createPendingOrders(
  items: CartItem[],
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  },
  address: string
): Promise<{ success: boolean; orderIds: number[]; error?: string }> {
  const orderIds: number[] = [];
  
  for (const item of items) {
    const { data, error } = await supabase
      .from('siparisler')
      .insert({
        customerName: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        email: customer.email || null,
        address: address,
        productName: item.title,
        color: item.color,
        size: item.size,
        eventDate: item.date,
        price: `${item.price} TL`,
        status: 'Ödeme Yapıyor',
        orderDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Online',
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Sipariş oluşturma hatası:', error);
      // Önceki siparişleri temizle
      await deletePendingOrders(orderIds);
      return { success: false, orderIds: [], error: error.message };
    }
    
    if (data) {
      orderIds.push(data.id);
    }
  }
  
  return { success: true, orderIds };
}

/**
 * "Ödeme Yapıyor" durumundaki siparişleri sil
 */
export async function deletePendingOrders(orderIds: number[]): Promise<void> {
  if (orderIds.length === 0) return;
  
  const { error } = await supabase
    .from('siparisler')
    .delete()
    .in('id', orderIds)
    .eq('status', 'Ödeme Yapıyor');
  
  if (error) {
    console.error('Sipariş silme hatası:', error);
  }
}

/**
 * Siparişlerin durumunu "Hazırlanıyor" olarak güncelle
 */
export async function confirmOrders(orderIds: number[]): Promise<{ success: boolean; error?: string }> {
  if (orderIds.length === 0) return { success: false, error: 'Sipariş ID bulunamadı' };
  
  const { error } = await supabase
    .from('siparisler')
    .update({ status: 'Hazırlanıyor' })
    .in('id', orderIds)
    .eq('status', 'Ödeme Yapıyor');
  
  if (error) {
    console.error('Sipariş güncelleme hatası:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
