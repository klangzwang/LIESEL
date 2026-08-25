import React from 'react';
import { useStatusStore } from 'store/StatusStore';

// ============================================================================
// 1. Die neuen Look-Varianten passend zur Design-Spezifikation
// ============================================================================
export type ButtonLook =
  | 'standard'  // Dezent, fügt sich in Sidebars/MenuBar ein
  | 'active'    // Electric Cyan (#0070e0) für aktive Toggles / State
  | 'accent'    // Orange/Warm Amber (#ffaa00) für Primär-Aktionen
  | 'emerald'   // Green LED / Success / Running States
  | 'ruby'      // Crimson / Destructive / Stop / Delete
  | 'bordered'  // Subtiler technischer Rand für Secondary Controls
  | 'glossy';   // 3D Hardware/Synthesizer Knob Feel

// ============================================================================
// 2. Look-Mappings auf Tailwind-Klassen
// ============================================================================
const lookStyles: Record<ButtonLook, string> = {
  // Dezent & Dunkel (Standard-Buttons in der MenuBar / Sidebar)
  standard: 'text-[#aaa] hover:text-[#f9eedf] hover:bg-[#333333] active:bg-[#222]',

  // Active Control Blue (#0070e0 / Electric Cyan)
  active: 'bg-[#0070e0]/20 text-[#00a0ff] border border-[#0070e0]/40 hover:bg-[#0070e0]/30 hover:border-[#00a0ff]',

  // Primary Selection Accent (Warm Orange Glow)
  accent: 'bg-[#e67300]/15 text-[#ffaa00] border border-[#ffaa00]/40 hover:bg-[#e67300]/30 hover:shadow-[0_0_12px_rgba(245,136,0,0.45)]',

  // Success / Running State (Emerald Glow)
  emerald: 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30 hover:bg-[#10b981]/25 hover:shadow-[0_0_10px_rgba(16,185,129,0.35)]',

  // Danger / Stop / Ruby Crimson (#822222 / Crimson)
  ruby: 'bg-[#541616]/40 text-[#f87171] border border-[#822222]/60 hover:bg-[#822222] hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]',

  // Technical Border (Subtiler 1px Rahmen im Hardware-Look)
  bordered: 'border border-[#2e2e34] bg-[#18181c] text-[#8c8c8e] hover:text-[#f9eedf] hover:border-[#3d3d45] hover:bg-[#222]',

  // 3D Hardware/Synthesizer Header Gloss (Inspiration aus deinen Node-Header Gradients)
  glossy: 'bg-gradient-to-b from-[#444] via-[#2a2a2a] to-[#1a1a1a] border border-[#555]/40 text-[#d8d8d6] shadow-sm hover:from-[#555] hover:to-[#222] hover:text-white',
};

// ============================================================================
// 3. Aktive Zustände (Toggle = true / Active = true)
// ============================================================================
const activeStyles: Record<ButtonLook, string> = {
  standard: 'bg-[#0070e0] text-white shadow-[0_0_10px_rgba(0,112,224,0.5)]',
  active: 'bg-[#0070e0] text-white border-[#00a0ff] shadow-[0_0_14px_rgba(0,160,255,0.6)]',
  accent: 'bg-[#e67300] text-white border-[#ffaa00] shadow-[0_0_18px_rgba(245,136,0,0.55)]',
  emerald: 'bg-[#10b981] text-black font-semibold border-[#34d399] shadow-[0_0_14px_rgba(52,211,153,0.6)]',
  ruby: 'bg-[#ef4444] text-white border-[#f87171] shadow-[0_0_14px_rgba(239,68,68,0.6)]',
  bordered: 'border-[#0070e0] bg-[#0070e0]/20 text-[#00a0ff]',
  glossy: 'bg-gradient-to-b from-[#0070e0] to-[#004080] border-[#00a0ff] text-white shadow-[0_0_12px_rgba(0,112,224,0.7)]',
};

export interface ButtonProps {
  icon?: React.ElementType | null;
  iconsize?: number;
  buttonwh?: number;
  children?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  look?: ButtonLook;
  clickeffect?: boolean;
  text?: string;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  icon: Icon,
  iconsize = 18,
  buttonwh = 1.5,
  children,
  onClick,
  active,
  disabled = false,
  look = 'standard',
  clickeffect = false,
  text = "",
  className = '',
  onMouseEnter,
  onMouseLeave
}) => {

  const currentStyle = active ? activeStyles[look] : lookStyles[look];
  const currentEffect = clickeffect ? "active:scale-[80%]" : "transition-all duration-200";

  return (
    <>
      {disabled ? (
        <div className={`w-auto h-auto p-${buttonwh} flex text-[#555] text-[0.8rem] items-center justify-center cursor-not-allowed opacity-50 gap-1 ${className}`}>
          {Icon && <Icon size={iconsize} />}
          {text}
          {children}
        </div>
      ) : (
        <button
          disabled={disabled}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`w-auto h-auto p-${buttonwh} flex text-[0.8rem] items-center justify-center rounded-md cursor-pointer gap-1
              ${currentEffect} ${currentStyle} ${className}`}
        >
          {Icon && <Icon size={iconsize} />}
          {text}
          {children}
        </button>
      )}
    </>
  );
};

// ============================================================================
export interface StatusButtonProps extends ButtonProps {
  statusText: string;
}

export const StatusButton: React.FC<StatusButtonProps> = ({
  statusText,
  ...restProps
}) => {
  const setStatus = useStatusStore(state => state.setText);
  const clearStatus = useStatusStore(state => state.clearText);

  return (
    <Button
      {...restProps}
      onMouseEnter={() => setStatus(statusText)}
      onMouseLeave={() => clearStatus()}
    />
  );
};

// ============================================================================
export interface ConfirmButtonProps extends ButtonProps {
  confirmMessage: string;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  confirmMessage,
  onClick,
  ...restProps
}) => {
  const handleClick = () => {
    if (window.confirm(confirmMessage)) {
      onClick?.();
    }
  };

  return <Button {...restProps} onClick={handleClick} />;
};

// ============================================================================
export interface ToggleButtonProps extends Omit<ButtonProps, 'active'> {
  isToggled: boolean;
  onToggle: () => void;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  isToggled,
  onToggle,
  ...restProps
}) => {
  return <Button {...restProps} active={isToggled} onClick={onToggle} />;
};
