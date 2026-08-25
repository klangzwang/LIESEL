import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';
import { useStatusStore } from '../../store/StatusStore';

interface NodeWidgetProps {
  type: string;
  title: string;
  category?: string;
  icon?: LucideIcon;
  description?: string;
  portInfo?: string;
}

export const NodeWidget: React.FC<NodeWidgetProps> = ({
  type = 'elementNode',
  title = 'ElementNode',
  category = 'Generator',
  icon: Icon = Layers,
  description = '12 Categories to 1 Output String',
  portInfo = '12 in / 1 out',
}) => {
  const { setText, clearText } = useStatusStore();

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setText(`Drag ${title} to Canvas (${description})`)}
      onMouseLeave={() => clearText()}
      className="group relative flex flex-col justify-between p-2.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2e2e2e] hover:border-[#0070e0]/60 rounded transition-all shadow-sm cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#0070e0]/10 text-[#0070e0] group-hover:bg-[#0070e0]/20 transition-colors">
            <Icon size={14} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition-colors">
              {title}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">{category}</div>
          </div>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 group-hover:text-[#3894f8] transition-colors">
          {portInfo}
        </span>
      </div>

      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-white/5 text-[9px] text-gray-500">
        <span className="text-gray-400 truncate max-w-[140px]">{description}</span>
        <span className="px-1.5 py-[2px] rounded bg-[#0070e0]/10 text-[#60a5fa] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          Drag to Grid
        </span>
      </div>
    </div>
  );
};
