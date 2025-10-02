// Sepet öğesi için tip tanımı
export interface CartItem {
  id: string; // Unique identifier (productId_variantId_date)
  productId: string;
  title: string;
  price: number;
  color: string;
  size: string;
  date: string;
  image: string;
}

// Aynı ürün, varyant ve tarih için çakışma kontrolü
export function hasDateConflict(
  existingItems: CartItem[],
  productId: string,
  color: string,
  size: string,
  date: string
): boolean {
  return existingItems.some(item => 
    item.productId === productId &&
    item.color === color &&
    item.size === size &&
    item.date === date
  );
}

// Unique ID oluşturan fonksiyon
export function generateCartItemId(
  productId: string,
  color: string,
  size: string,
  date: string
): string {
  return `${productId}_${color}_${size}_${date}`.replace(/\s+/g, '_');
}

// Sepete ürün ekleyen ana fonksiyon
export function addToCart(
  productId: string,
  title: string,
  price: number,
  color: string,
  size: string,
  date: string,
  image: string
): {
  success: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
} {
  try {
    // Mevcut sepet öğelerini al
    const existingItems: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Unique ID oluştur
    const itemId = generateCartItemId(productId, color, size, date);
    
    // Aynı ürün, varyant ve tarih kontrolü
    const exactMatch = existingItems.find(item => item.id === itemId);
    if (exactMatch) {
      return {
        success: false,
        message: 'Bu ürün aynı varyant ve tarih ile zaten sepetinizde bulunuyor.',
        type: 'warning'
      };
    }

    // Çakışan tarih kontrolü
    if (hasDateConflict(existingItems, productId, color, size, date)) {
      return {
        success: false,
        message: 'Bu ürün için seçtiğiniz tarih mevcut rezervasyonlarla çakışıyor.',
        type: 'error'
      };
    }

    // Yeni ürünü sepete ekle
    const newItem: CartItem = {
      id: itemId,
      productId,
      title,
      price,
      color,
      size,
      date,
      image
    };

    const updatedItems = [...existingItems, newItem];
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    
    // Sepet güncellendiği sinyalini gönder
    window.dispatchEvent(new Event('cartUpdated'));

    return {
      success: true,
      message: 'Ürün başarıyla sepete eklendi!',
      type: 'success'
    };

  } catch (error) {
    console.error('Sepete ekleme hatası:', error);
    return {
      success: false,
      message: 'Ürün sepete eklenirken bir hata oluştu.',
      type: 'error'
    };
  }
}

// Sepetteki toplam ürün sayısını dönen fonksiyon
export function getCartItemCount(): number {
  try {
    const items: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
    return items.length;
  } catch {
    return 0;
  }
}

// Sepeti temizleyen fonksiyon
export function clearCart(): void {
  localStorage.setItem('cartItems', JSON.stringify([]));
  window.dispatchEvent(new Event('cartUpdated'));
}

// Belirli bir ürünü sepetten kaldıran fonksiyon
export function removeFromCart(itemId: string): boolean {
  try {
    const existingItems: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const updatedItems = existingItems.filter(item => item.id !== itemId);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('cartUpdated'));
    return true;
  } catch {
    return false;
  }
}