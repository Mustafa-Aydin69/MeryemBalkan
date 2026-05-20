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

