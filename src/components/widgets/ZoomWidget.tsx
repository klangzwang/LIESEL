import React, { useState, useEffect, useRef } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import { StatusButton } from './ButtonWidget';
import { Minus, Plus } from 'lucide-react';
import { DividerVertical } from './DividerWidget';

export const Zoom: React.FC = () => {
  const { setViewport, zoomTo } = useReactFlow();
  // const transform = useStore((s) => s.transform);
  // const zoom = transform[2];

  const zoom = useStore((s) => s.transform[2]);

  const [isHovered, setIsHovered] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Wenn der Benutzer den Canvas verschiebt, setzen wir das Dimmen zurück
    if (!isHovered) {
      setIsDimmed(false);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsDimmed(true);
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [zoom, isHovered]); // 💡 Verwenden Sie nur `zoom` anstelle des gesamten `transform`-Arrays!

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsDimmed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsDimmed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 5000);
  };

  const handleZoomIn = () => {
    if (zoom >= 0.9 && zoom < 1.0) {
      zoomTo(1);
    } else {
      zoomTo(zoom + 0.15);
    }
  };

  const handleZoomOut = () => {
    if (zoom <= 1.1 && zoom > 1.0) {
      zoomTo(1);
    } else {
      zoomTo(zoom - 0.15);
    }
  };

  const opacityClass = isDimmed && !isHovered ? 'opacity-50' : 'opacity-100';

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`absolute bottom-4 left-4 flex items-center gap-2 bg-[#18181b]/90 border border-zinc-800 rounded-lg p-1.5 backdrop-blur-md shadow-xl text-zinc-300 text-xs z-20 select-none transition-opacity duration-500 ease-in-out ${opacityClass}`}
    >
      <StatusButton icon={Minus} onClick={handleZoomOut} statusText="Zoom Out" look='active' />
      <span className="font-mono text-[12px] w-12 text-center text-zinc-400">
        {Math.round(zoom * 100)}%
      </span>
      <StatusButton icon={Plus} onClick={handleZoomIn} statusText="Zoom In" look='active' />
      <DividerVertical darkstyle={false} smalloffset={false} className="opacity-50" />
      <StatusButton text='ResetZoom' onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 500 })} statusText="Reset the Zoom" look='bordered' />
    </div>
  );
};
