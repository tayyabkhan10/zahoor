import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-3xl text-brand">Add product</h1>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
