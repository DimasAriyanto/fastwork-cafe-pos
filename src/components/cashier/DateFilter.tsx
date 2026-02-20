import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";

interface DateFilterProps {
    onFilterChange: (range: { start: string; end: string }) => void;
    initialRange?: { start: string; end: string };
}

export default function DateFilter({ onFilterChange, initialRange }: DateFilterProps) {
    const [showFilter, setShowFilter] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(initialRange || { start: "", end: "" });
    const [activeQuickFilter, setActiveQuickFilter] = useState<string>("");
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilter(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Notify parent of changes
    useEffect(() => {
        onFilterChange(dateRange);
    }, [dateRange, onFilterChange]);

    // Quick Filter Logic
    const handleQuickFilter = (type: string) => {
        setActiveQuickFilter(type);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        // Helper to format YYYY-MM-DD
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        switch (type) {
            case "Hari Ini":
                // start and end are already today
                break;
            case "Kemarin":
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case "Bulan Ini":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                // end is today
                break;
            case "Bulan Lalu":
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of prev month
                break;
            case "3 Bulan Lalu":
                start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                // end is today
                break;
            default:
                break;
        }

        setDateRange({ start: fmt(start), end: fmt(end) });
    };

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => setShowFilter(!showFilter)}
                className={`p-2.5 rounded-xl border transition-all duration-200 bg-white
    ${showFilter
                        ? "border-[#FE4E10] shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.8335 17.5L5.8335 15" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14.167 17.5L14.167 12.5" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14.167 5L14.167 2.5" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.8335 7.5L5.8335 2.5" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.8335 15C5.05693 15 4.66864 15 4.36236 14.8731C3.95398 14.704 3.62952 14.3795 3.46036 13.9711C3.3335 13.6649 3.3335 13.2766 3.3335 12.5C3.3335 11.7234 3.3335 11.3351 3.46036 11.0289C3.62952 10.6205 3.95398 10.296 4.36236 10.1269C4.66864 10 5.05693 10 5.8335 10C6.61007 10 6.99835 10 7.30464 10.1269C7.71302 10.296 8.03747 10.6205 8.20663 11.0289C8.3335 11.3351 8.3335 11.7234 8.3335 12.5C8.3335 13.2766 8.3335 13.6649 8.20663 13.9711C8.03747 14.3795 7.71302 14.704 7.30464 14.8731C6.99835 15 6.61007 15 5.8335 15Z" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" />
                    <path d="M14.167 10C13.3904 10 13.0021 10 12.6959 9.87313C12.2875 9.70398 11.963 9.37952 11.7939 8.97114C11.667 8.66485 11.667 8.27657 11.667 7.5C11.667 6.72343 11.667 6.33515 11.7939 6.02886C11.963 5.62048 12.2875 5.29602 12.6959 5.12687C13.0021 5 13.3904 5 14.167 5C14.9436 5 15.3318 5 15.6381 5.12687C16.0465 5.29602 16.371 5.62048 16.5401 6.02886C16.667 6.33515 16.667 6.72343 16.667 7.5C16.667 8.27657 16.667 8.66485 16.5401 8.97114C16.371 9.37952 16.0465 9.70398 15.6381 9.87313C15.3318 10 14.9436 10 14.167 10Z" stroke={showFilter ? "#FE4E10" : "#888888"} strokeWidth="1.25" />
                </svg>
            </button>


            {/* Filter Popup */}
            {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 animate-scaleIn origin-top-right">

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Dari</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, start: e.target.value }));
                                        setActiveQuickFilter(""); // Clear quick filter if manual
                                    }}
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                    className="w-full pl-9 pr-2 py-2 text-sm bg-white border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-[#FE4E10] focus:ring-1 focus:ring-[#FE4E10] transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#FE4E10]" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Sampai</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, end: e.target.value }));
                                        setActiveQuickFilter("");
                                    }}
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                    className="w-full pl-9 pr-2 py-2 text-sm bg-white border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-[#FE4E10] focus:ring-1 focus:ring-[#FE4E10] transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#FE4E10]" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="space-y-2">
                        {["Hari Ini", "Kemarin", "Bulan Ini", "Bulan Lalu", "3 Bulan Lalu"].map((label) => (
                            <button
                                key={label}
                                onClick={() => handleQuickFilter(label)}
                                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 border ${activeQuickFilter === label
                                    ? "bg-[#FE4E10] text-white border-[#FE4E10] shadow-md shadow-orange-500/20"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:scale-[1.02]"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}
