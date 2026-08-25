interface DividerProps {
    sized?: string;
    darkstyle?: boolean;
    xoffset?: string;
    smalloffset?: boolean;
    className?: string;
}

// Dev Remember
// my-auto mx-1
export const DividerVertical: React.FC<DividerProps> = ({
    sized = "0.5",
    darkstyle = true,
    xoffset = "4",
    smalloffset = true,
    className = ''
}) => {
    return <div className={`flex w-${sized} mx-[${xoffset}px] ${smalloffset ? "py-4" : "py-2"} ${darkstyle ? "bg-[#111]/60" : "bg-zinc-700"} ${className}`} />
};
