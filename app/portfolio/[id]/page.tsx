import ProductDetail from './ProductDetail';

export async function generateStaticParams() {
  return Array.from({ length: 24 }, (_, i) => ({
    id: `p${i + 1}`, // ✅ p1, p2, p3...
  }));
}

// Next.js App Router için doğru props tipi
interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: PageProps) {
  const numericId = params.id.replace("p", ""); // p1 → 1
  return <ProductDetail productId={numericId} />;
}
