import ProductDetail from './ProductDetail';
import { createClient } from "@supabase/supabase-js";

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
    slug: `${item.id}-${item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  }));
}

// Ürün verisini server-side'da çek
async function getProductData(productId: string) {
  // Tüm sorguları paralel yap
  const [productResult, datesResult] = await Promise.all([
    // Ana ürün
    supabase
      .from("urunler")
      .select("*")
      .eq("id", productId)
      .eq("status", "Yayında")
      .single(),
    
    // Disabled dates - productName için önce ürün title lazım, bu yüzden ayrı çekeceğiz
    null // Placeholder
  ]);

  if (productResult.error || !productResult.data) {
    return { product: null, relatedProducts: [], disabledDates: [] };
  }

  const productData = productResult.data;

  // Şimdi paralel olarak related products ve disabled dates çek
  const [relatedResult, disabledDatesResult] = await Promise.all([
    // Related products
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

  // Ürün verisini formatla
  const product = {
    id: productData.id,
    title: productData.title,
    collection: productData.collection,
    year: productData.year,
    price: productData.price,
    description: productData.description || 'Size özel tasarlanmış zarif elbise.',
    features: productData.features && productData.features.length > 0
      ? productData.features
      : ['Özel tasarım', 'Kaliteli kumaş', 'Profesyonel işçilik'],
    size: productData.size && productData.size.length > 0
      ? productData.size
      : ['36', '38', '40', '42'],
    colors: productData.colors && productData.colors.length > 0
      ? productData.colors
      : ['Siyah', 'Lacivert'],
    images: productData.images && productData.images.length > 0
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
    images: item.images && Array.isArray(item.images) && item.images.length > 0
      ? `${IMAGE_BASE_URL}${item.images[0]}`
      : '/images/AnaSayfa/Meryem_Balkan_Logo.jpg',
    slug: `${item.id}-${item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  })) || [];

  // Disabled dates hesapla
  const disabledDates: string[] = [];
  if (disabledDatesResult.data) {
    disabledDatesResult.data.forEach(({ eventDate }) => {
      if (!eventDate) return;
      const event = new Date(eventDate);
      for (let i = -7; i <= 7; i++) {
        const d = new Date(event);
        d.setDate(event.getDate() + i);
        disabledDates.push(d.toISOString().split('T')[0]);
      }
    });
  }

  return { product, relatedProducts, disabledDates };
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.slug.split('-')[0];
  
  // Server-side'da veriyi çek
  const { product, relatedProducts, disabledDates } = await getProductData(productId);
  
  return (
    <ProductDetail 
      product={product}
      relatedProducts={relatedProducts}
      disabledDates={disabledDates}
    />
  );
}
