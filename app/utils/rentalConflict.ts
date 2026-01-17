// Kiralama çakışma kontrolü utility
// Tüm işlemler API route üzerinden yapılır (RLS bypass için)

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
 * Ürünün yayında olup olmadığını kontrol et
 */
export async function checkProductStatus(productId: string): Promise<{ isActive: boolean; productName: string | null }> {
  try {
    const response = await fetch('/api/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkProductStatus', productId }),
    });

    const data = await response.json();
    return { isActive: data.isActive || false, productName: data.productName || null };
  } catch (err) {
    console.error('Ürün durumu kontrol hatası:', err);
    return { isActive: false, productName: null };
  }
}

/**
 * Tek bir ürün için çakışma kontrolü yap
 */
export async function checkSingleConflict(productName: string, eventDate: string): Promise<{ hasConflict: boolean; reason: string }> {
  try {
    const response = await fetch('/api/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkSingleConflict', productName, eventDate }),
    });

    const data = await response.json();
    return { hasConflict: data.hasConflict || false, reason: data.reason || '' };
  } catch (err) {
    console.error('Çakışma kontrolü hatası:', err);
    return { hasConflict: false, reason: '' };
  }
}

/**
 * Sepetteki tüm ürünler için çakışma kontrolü yap
 */
export async function checkCartConflicts(cartItems: CartItem[]): Promise<CheckResult> {
  try {
    const response = await fetch('/api/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkCartConflicts', cartItems }),
    });

    const data = await response.json();
    return {
      hasConflict: data.hasConflict || false,
      conflicts: data.conflicts || [],
      validItems: data.validItems || []
    };
  } catch (err) {
    console.error('Sepet çakışma kontrolü hatası:', err);
    return { hasConflict: false, conflicts: [], validItems: cartItems };
  }
}

/**
 * Siparişleri "Ödeme Yapıyor" durumu ile kaydet
 * API route üzerinden çalışır (RLS bypass için)
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
  try {
    const response = await fetch('/api/create-pending-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, customer, address }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Sipariş oluşturma hatası:', data.error);
      return { success: false, orderIds: [], error: data.error || 'Sipariş oluşturulamadı' };
    }

    return { success: true, orderIds: data.orderIds };
  } catch (error: any) {
    console.error('Sipariş oluşturma hatası:', error);
    return { success: false, orderIds: [], error: error.message };
  }
}

/**
 * "Ödeme Yapıyor" durumundaki siparişleri sil
 * API route üzerinden çalışır (RLS bypass için)
 */
export async function deletePendingOrders(orderIds: number[]): Promise<void> {
  if (orderIds.length === 0) return;
  
  try {
    await fetch('/api/cleanup-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds }),
    });
  } catch (error) {
    console.error('Sipariş silme hatası:', error);
  }
}

/**
 * Siparişlerin durumunu "Hazırlanıyor" olarak güncelle
 * API route üzerinden çalışır (RLS bypass için)
 */
export async function confirmOrders(orderIds: number[]): Promise<{ success: boolean; error?: string }> {
  if (orderIds.length === 0) return { success: false, error: 'Sipariş ID bulunamadı' };
  
  try {
    const response = await fetch('/api/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Sipariş güncelleme hatası:', data.error);
      return { success: false, error: data.error || 'Güncelleme başarısız' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sipariş güncelleme hatası:', error);
    return { success: false, error: error.message };
  }
}
