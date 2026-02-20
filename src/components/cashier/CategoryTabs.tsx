import { CATEGORIES } from "../../constants/products";

type CategoryTabsProps = {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
};

export default function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{selectedCategory}</h1>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.name}
                        onClick={() => onSelectCategory(category.name)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap transition-all border ${selectedCategory === category.name
                            ? "bg-orange-50 border-orange-300 text-orange-600 shadow-sm"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <span className="text-lg">{category.icon}</span>
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">{category.name}</span>
                            <span className="text-xs text-gray-500">{category.count} menu</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
