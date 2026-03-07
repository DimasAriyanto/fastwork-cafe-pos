import type { Product } from "../../types/cashier";
import ProductCard from "./ProductCard";

type ProductListProps = {
    products: Product[];
    onProductClick: (product: Product) => void;
};

export default function ProductList({ products, onProductClick }: ProductListProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} onClick={onProductClick} />
            ))}
        </div>
    );
}
