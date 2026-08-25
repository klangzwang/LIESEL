import React from 'react';

const appVersion = import.meta.env.PACKAGE_VERSION;

export enum CornerAnchor {
  UpperLeft = "UPPERLEFT",
  UpperRight = "UPPERRIGHT",
  LowerLeft = "LOWERLEFT",
  LowerRight = "LOWERRIGHT",
}

const anchorClasses: Record<CornerAnchor, string> = {
  [CornerAnchor.UpperLeft]: "top-0 left-0",
  [CornerAnchor.UpperRight]: "top-0 right-0",
  [CornerAnchor.LowerLeft]: "bottom-0 left-0",
  [CornerAnchor.LowerRight]: "bottom-0 right-0",
};

interface VersionProps {
  anchor?: CornerAnchor;
  className?: string;
}

export const Version: React.FC<VersionProps> = ({ 
  anchor = CornerAnchor.UpperLeft,
  className = ""
}) => {
  return (
    <div 
      className={`absolute p-2 pointer-events-none select-none text-xs font-mono opacity-50 ${anchorClasses[anchor]} ${className}`}
    >
      v{appVersion}
    </div>
  );
};
