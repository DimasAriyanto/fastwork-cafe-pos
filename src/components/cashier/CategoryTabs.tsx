type CategoryTabsProps = {
    categories: { name: string; icon: string; count: number }[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
};

export default function CategoryTabs({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) {
    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{selectedCategory}</h1>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        onClick={() => onSelectCategory(category.name)}
                        className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl whitespace-nowrap transition-all border text-left ${selectedCategory === category.name
                            ? "bg-orange-50 border-orange-300 text-orange-600 shadow-sm"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <span className="text-base sm:text-lg">{category.icon}</span>
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-xs sm:text-sm">{category.name}</span>
                            <span className="text-[10px] sm:text-xs text-gray-500">{category.count} menu</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
