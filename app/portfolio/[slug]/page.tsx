import ProductDetail from './ProductDetail';
import { createClient } from "@supabase/supabase-js";
import { createSlug, parseIdFromSlug } from '../../utils/slugUtils';
import { unstable_cache } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  
);

const IMAGE_BASE_URL = "https://orplwznpdpwnyflkbuoy.supabase.co/storage/v1/object/public/urunler/";

export async function generateStaticParams() {
  const { data } = await supabase
    .from("urunler")
    .select("id, title")
    .eq("status", "Yayında");

  if (!data) return [];

  return data.map((item) => ({
    slug: createSlug(item.id, item.title)
  }));
}

// Cache'li ürün ve related products (bu veriler sık değişmiyor)
const getCachedProductData = unstable_cache(
  async (productId: string) => {
    const productResult = await supabase
      .from("urunler")
      .select("id, title, collection, year, price, description, features, size, colors, images, category")
      .eq("id", productId)
      .eq("status", "Yayında")
      .single();

    if (productResult.error || !productResult.data) {
      return { product: null, relatedProducts: [] };
    }

    const productData = productResult.data;

    // Related products
    const relatedResult = await supabase
      .from("urunler")
      .select("id, title, collection, price, images")
      .eq("category", productData.category)
      .eq("status", "Yayında")
      .neq("id", productId)
      .limit(4);

    // Ürün formatla
    const product = {
      id: productData.id,
      title: productData.title,
      collection: productData.collection,
      year: productData.year,
      price: productData.price,
      description: productData.description || 'Size özel tasarlanmış zarif elbise.',
      features: productData.features?.length > 0
        ? productData.features
        : ['Özel tasarım', 'Kaliteli kumaş', 'Profesyonel işçilik'],
      size: productData.size?.length > 0
        ? productData.size
        : ['36', '38', '40', '42'],
      colors: productData.colors?.length > 0
        ? productData.colors
        : ['Siyah', 'Lacivert'],
      images: productData.images?.length > 0
        ? productData.images.map((img: string) => `${IMAGE_BASE_URL}${img}`)
        : ['/images/AnaSayfa/Meryem_Balkan_Logo.jpg'],
      category: productData.category,
    };

    // Related products formatla
    const relatedProducts = relatedResult.data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      collection: item.collection,
      price: item.price,
      images: item.images?.[0]
        ? `${IMAGE_BASE_URL}${item.images[0]}`
        : '/images/AnaSayfa/Meryem_Balkan_Logo.jpg',
      slug: createSlug(item.id, item.title)
    })) || [];

    return { product, relatedProducts };
  },
  ['product-data'],
  { revalidate: 60 } // Ürün bilgileri 60 saniye cache (sık değişmiyor)
);

// Disabled dates - CACHE YOK, her zaman güncel çekilir
async function getDisabledDates(productTitle: string): Promise<string[]> {
  const { data } = await supabase
    .from("siparisler")
    .select("eventDate")
    .eq("productName", productTitle)
    .in("status", ["Hazırlanıyor", "Kirada", "Ödeme Yapıyor"]);

  if (!data || data.length === 0) return [];

  // eventDate'den 7 gün önce ve 7 gün sonrası = toplam 15 gün bloke
  const disabledDates: string[] = [];
  data.forEach(({ eventDate }) => {
    if (!eventDate) return;
    const event = new Date(eventDate);
    for (let i = -7; i <= 7; i++) {
      const d = new Date(event);
      d.setDate(event.getDate() + i);
      // Local date string kullan (timezone sorunu önlemek için)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      disabledDates.push(dateStr);
    }
  });

  // Tekrarlayan tarihleri kaldır
  return [...new Set(disabledDates)];
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = parseIdFromSlug(resolvedParams.slug);
  
  // Ürün bilgileri cache'ten çekilir
  const { product, relatedProducts } = await getCachedProductData(productId);
  
  // Disabled dates HER ZAMAN güncel çekilir (cache yok)
  const disabledDates = product ? await getDisabledDates(product.title) : [];
  
  return (
    <ProductDetail 
      product={product}
      relatedProducts={relatedProducts}
      disabledDates={disabledDates}
    />
  );
}
