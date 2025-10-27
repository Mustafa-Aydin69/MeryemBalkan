import ProductDetail from './ProductDetail';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  
);

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

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ProductPage({ params }: PageProps) {
  // params'ı await ile al (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  
  // "123-siyah-gece-elbisesi" formatından ID'yi çıkar
  const productId = resolvedParams.slug.split('-')[0];
  
  return <ProductDetail productId={productId} />;
}