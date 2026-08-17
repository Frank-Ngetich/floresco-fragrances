import { ProductEditor } from '@/components/admin/ProductEditor';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <ProductEditor productId={params.id} />;
}
