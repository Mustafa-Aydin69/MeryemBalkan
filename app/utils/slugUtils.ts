/**
 * Seed tabanlı pseudo-random sayı üreteci (tutarlı sonuç için)
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * ID ve isimden tutarlı hash oluşturur (her zaman aynı sonuç)
 * URL-safe karakterler kullanır (dosya sistemi uyumlu)
 * Örnek: "16-alexandra" -> "f7a3x9b2c1y8d3e4z2f5"
 */
function generateConsistentHash(id: string | number, name: string): string {
  const input = `${id}-${name}`;
  // URL-safe ve dosya sistemi uyumlu ayırıcılar (sadece harf ve rakam)
  const separators = ['x', 'y', 'z', 'w', 'v', 'q', 'k', 'm', 'n', 'p'];
  
  // Ana seed hesapla
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    seed = ((seed << 5) - seed) + char;
    seed = seed & seed;
  }
  
  const random = seededRandom(Math.abs(seed));
  
  // 16 karakterlik hex hash oluştur (4 parça x 4 karakter)
  const hashParts: string[] = [];
  for (let part = 0; part < 4; part++) {
    let partHash = Math.abs(seed + part * 12345);
    for (let j = 0; j < 4; j++) {
      partHash = ((partHash << 5) - partHash) + (part + j);
      partHash = partHash & partHash;
    }
    hashParts.push(Math.abs(partHash).toString(16).padStart(4, '0').slice(0, 4));
  }
  
  // Parçaları URL-safe ayırıcılarla birleştir
  let result = hashParts[0];
  for (let i = 1; i < hashParts.length; i++) {
    const charIndex = Math.floor(random() * separators.length);
    result += separators[charIndex] + hashParts[i];
  }
  
  return result;
}

/**
 * SEO dostu URL slug oluşturur
 * Örnek: "Alexandra Pelerinli Elbise" -> "16-alexandra-pelerinli-elbise-f7a3b2c1"
 * 
 * @param id - Ürün ID'si (URL'den parse edilebilir)
 * @param title - Ürün başlığı
 * @returns SEO dostu slug
 */
export function createSlug(id: number | string, title: string): string {
  const slug = title
    .toLowerCase()
    // Türkçe karakterleri dönüştür
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/Ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    // Özel karakterleri temizle, boşlukları tire yap
    .replace(/[^a-z0-9]+/g, '-')
    // Baş ve sondaki tireleri kaldır
    .replace(/^-+|-+$/g, '');

  const hash = generateConsistentHash(id, slug);
  
  return `${id}-${slug}-${hash}`;
}

/**
 * Slug'dan ID'yi parse eder
 * Örnek: "16-alexandra-pelerinli-elbise-a7f3b2c1" -> "16"
 * 
 * @param slug - URL slug
 * @returns Ürün ID'si
 */
export function parseIdFromSlug(slug: string): string {
  return slug.split('-')[0];
}

