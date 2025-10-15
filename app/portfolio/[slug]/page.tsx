import ProductDetail from './ProductDetail';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://orplwznpdpwnyflkbuoy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycGx3em5wZHB3bnlmbGtidW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM5MzksImV4cCI6MjA3NTM0OTkzOX0.vjYN3-jHAJknRjOFv2V21MyQR8KrG6zFRmEJ6PoVW0c"
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