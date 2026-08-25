import React, { useState } from "react";
import { Plus, Search, Settings, BookOpen, LucideIcon } from "lucide-react";
import { useStatusStore } from "store/StatusStore";

//
// PANEL HEADER
//
interface PanelHeaderProps {
    title: string;
    extras?: boolean;
    icon?: LucideIcon;
    searchValue?: string;
    onSearchChange?: (val: string) => void;
    onAddClick?: () => void;
    onSettingsClick?: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    title,
    extras = true,
    icon: Icon = BookOpen,
    searchValue = "",
    onSearchChange,
    onAddClick,
    onSettingsClick,
}) => {
    const [localSearch, setLocalSearch] = useState(searchValue);
    const { setText, clearText } = useStatusStore();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
        onSearchChange?.(e.target.value);
    };

    return (
        <div className="flex flex-col shrink-0 w-full bg-[#181818]">
            {/* Tab Bar at Top (UE5 Dock Tab Style) */}
            <div className="flex items-end h-[28px] bg-[#141414] border-b border-[#101010] px-1.5 pt-1 select-none">
                <div className="flex items-center gap-1.5 h-[23px] px-3 bg-[#202020] border-t border-x border-[#2c2c2c] rounded-t-[3px] text-[#cccccc] text-[11.5px] font-medium tracking-normal shadow-sm">
                    <Icon size={13} className="text-[#9e9e9e] shrink-0" />
                    <span>{title}</span>
                </div>
                <div className="flex-1" />
            </div>

            {/* Toolbar Row (Add, Search, Settings) */}
            {extras && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1e1e1e] border-b border-[#141414] shrink-0">
                    {/* Add Button */}
                    {/* <button
                        onClick={onAddClick}
                        onMouseEnter={() => setText("Add new element...")}
                        onMouseLeave={clearText}
                        className="flex items-center gap-1 px-2.5 py-0.5 bg-[#2b2b2b] hover:bg-[#353535] active:bg-[#222222] border border-[#3e3e3e] hover:border-[#4d4d4d] rounded-[3px] text-[#d1d5db] text-[11.5px] font-medium transition-colors cursor-pointer shadow-sm shrink-0"
                        title="Add"
                    >
                        <Plus size={13} strokeWidth={2.5} className="text-[#54b848]" />
                        <span>Add</span>
                    </button> */}

                    {/* Search Field */}
                    <div className="relative flex-1 flex items-center bg-[#131313] border border-[#2b2b2b] focus-within:border-[#404040] rounded-[3px] px-2 py-0.5 transition-colors">
                        <Search size={12} className="text-[#6e6e6e] mr-1.5 shrink-0 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={localSearch}
                            onChange={handleSearch}
                            className="w-full bg-transparent text-[11px] text-[#d4d4d4] placeholder-[#5a5a5a] focus:outline-none"
                        />
                    </div>

                    {/* Settings / Gear Button */}
                    <button
                        onClick={onSettingsClick}
                        onMouseEnter={() => setText("Settings & Filters")}
                        onMouseLeave={clearText}
                        className="p-1 rounded text-[#888888] hover:text-[#e0e0e0] hover:bg-[#282828] active:bg-[#202020] transition-colors cursor-pointer shrink-0"
                        title="Options"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

//
// CANVAS HEADER
//
interface CanvasHeaderProps {
    icon?: LucideIcon;
    title: string;
    onClick: () => void;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
    icon: Icon = BookOpen,
    title,
    onClick,
}) => {
    const { setText, clearText } = useStatusStore();

    return (
        <div className="flex flex-col shrink-0 w-full bg-[#181818]">
            <div className="flex items-end h-[28px] bg-[#141414] px-0.5 pt-1 select-none">

                <button
                    onClick={onClick}
                    onMouseEnter={() => setText("Show " + title)}
                    onMouseLeave={clearText}
                    className="flex items-center gap-1.5 h-[23px] px-3 bg-[#202020] rounded-t-lg border-t border-[#2c2c2c] text-[#cccccc] text-[11.5px] font-medium tracking-normal shadow-sm"
                >
                    <Icon size={13} className="text-[#9e9e9e] shrink-0" />
                    <span>{title}</span>
                </button>

                {/* <div className="flex-1" /> */}

            </div>
        </div>
    );
};

//
// COLLAPSIBLE SECTION
//
interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    defaultOpen = true,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col w-full shrink-0 select-none">
            {/* Header Row */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-2 py-1 bg-[#242424] hover:bg-[#2a2a2a] border-b border-[#181818] cursor-pointer transition-colors group"
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {/* Small solid triangle indicator matching UE5 style */}
                    <svg
                        className={`w-2 h-2 text-[#888888] group-hover:text-[#aaaaaa] transition-transform duration-100 shrink-0 ${isOpen ? "rotate-0" : "-rotate-90"
                            }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 18L3 6h18l-9 12z" />
                    </svg>
                    <span className="text-[11px] font-bold text-[#b0b0b0] group-hover:text-[#dddddd] uppercase tracking-wide">
                        {title}
                    </span>
                </div>
            </div>

            {/* Expandable Content Container */}
            {isOpen && (
                <div className="flex flex-col w-full pl-5">
                    {children}
                </div>
            )}
        </div>
    );
};

