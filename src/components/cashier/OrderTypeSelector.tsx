type OrderTypeSelectorProps = {
    orderType: "dinein" | "takeaway";
    setOrderType: (type: "dinein" | "takeaway") => void;
};

export default function OrderTypeSelector({ orderType, setOrderType }: OrderTypeSelectorProps) {
    return (
        <div className="mb-8">
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setOrderType("dinein")}
                    className={`p-3 rounded-lg text-center font-medium text-sm transition-all duration-200 ${orderType === "dinein"
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                        }`}
                >
                    Makan di tempat
                </button>
                <button
                    onClick={() => setOrderType("takeaway")}
                    className={`p-3 rounded-lg text-center font-medium text-sm transition-all duration-200 ${orderType === "takeaway"
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                        }`}
                >
                    Bawa pulang
                </button>
            </div>
        </div>
    );
}
