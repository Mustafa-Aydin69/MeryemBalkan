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

// Cache'li ürün verisi çekme (60 saniye)
const getCachedProductData = unstable_cache(
  async (productId: string) => {
    // Önce sadece ürünü çek (en hızlı sorgu)
    const productResult = await supabase
      .from("urunler")
      .select("id, title, collection, year, price, description, features, size, colors, images, category")
      .eq("id", productId)
      .eq("status", "Yayında")
      .single();

    if (productResult.error || !productResult.data) {
      return { product: null, relatedProducts: [], disabledDates: [] };
    }

    const productData = productResult.data;

    // İkincil verileri paralel çek
    const [relatedResult, disabledDatesResult] = await Promise.all([
      // Related products - sadece gerekli alanlar
      supabase
        .from("urunler")
        .select("id, title, collection, price, images")
        .eq("category", productData.category)
        .eq("status", "Yayında")
        .neq("id", productId)
        .limit(4),
      
      // Disabled dates
      supabase
        .from("siparisler")
        .select("eventDate")
        .eq("productName", productData.title)
    ]);

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

    // Disabled dates hesapla
    const disabledDates: string[] = [];
    disabledDatesResult.data?.forEach(({ eventDate }) => {
      if (!eventDate) return;
      const event = new Date(eventDate);
      for (let i = -7; i <= 7; i++) {
        const d = new Date(event);
        d.setDate(event.getDate() + i);
        disabledDates.push(d.toISOString().split('T')[0]);
      }
    });

    return { product, relatedProducts, disabledDates };
  },
  ['product-data'],
  { revalidate: 60 } // 60 saniye cache
);

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = parseIdFromSlug(resolvedParams.slug);
  
  // Cache'li veri çek
  const { product, relatedProducts, disabledDates } = await getCachedProductData(productId);
  
  return (
    <ProductDetail 
      product={product}
      relatedProducts={relatedProducts}
      disabledDates={disabledDates}
    />
  );
}
