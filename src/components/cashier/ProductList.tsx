import type { Product } from "../../types/cashier";
import ProductCard from "./ProductCard";

type ProductListProps = {
    products: Product[];
    onProductClick: (product: Product) => void;
};

export default function ProductList({ products, onProductClick }: ProductListProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} onClick={onProductClick} />
            ))}
        </div>
    );
}
