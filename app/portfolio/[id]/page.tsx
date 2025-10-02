import ProductDetail from './ProductDetail';

export async function generateStaticParams() {
  return Array.from({ length: 24 }, (_, i) => ({
    id: (i + 1).toString(),
  }));
}

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductDetail productId={params.id} />;
}
