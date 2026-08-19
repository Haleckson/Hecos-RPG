import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content?: React.ReactNode;
  title?: string;
  englishTitle?: string;
  description?: string;
  badge?: string;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  englishTitle,
  description,
  badge,
  shortcut,
  side = 'top',
  align = 'center',
  delay = 180,
  children,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timerRef = useRef<any>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // If no tooltip info is provided or disabled, render just children
  const hasContent = Boolean(content || title || description || englishTitle);
  if (!hasContent || disabled) {
    return <>{children}</>;
  }

  const showTooltip = () => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        // Approximate positioning based on side and align
        if (side === 'top') {
          top = rect.top - 8;
          if (align === 'start') left = rect.left;
          else if (align === 'end') left = rect.right;
          else left = rect.left + rect.width / 2;
        } else if (side === 'bottom') {
          top = rect.bottom + 8;
          if (align === 'start') left = rect.left;
          else if (align === 'end') left = rect.right;
          else left = rect.left + rect.width / 2;
        } else if (side === 'left') {
          left = rect.left - 8;
          top = rect.top + rect.height / 2;
        } else if (side === 'right') {
          left = rect.right + 8;
          top = rect.top + rect.height / 2;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className={`inline-flex items-center ${className}`}
    >
      {children}

      {isVisible && coords && (
        <div
          ref={tooltipRef}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform:
              side === 'top'
                ? align === 'start'
                  ? 'translate(0, -100%)'
                  : align === 'end'
                  ? 'translate(-100%, -100%)'
                  : 'translate(-50%, -100%)'
                : side === 'bottom'
                ? align === 'start'
                  ? 'translate(0, 0)'
                  : align === 'end'
                  ? 'translate(-100%, 0)'
                  : 'translate(-50%, 0)'
                : side === 'left'
                ? 'translate(-100%, -50%)'
                : 'translate(0, -50%)',
          }}
          className="fixed z-[99999] pointer-events-none max-w-xs sm:max-w-sm rounded-xl p-3 bg-[#0c0915]/95 backdrop-blur-xl border border-zinc-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header with Title and English/Badge */}
          {(title || englishTitle || badge) && (
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {title && <span className="font-extrabold text-xs text-amber-200">{title}</span>}
                {englishTitle && (
                  <span className="text-[10px] text-zinc-400 font-mono italic">
                    ({englishTitle})
                  </span>
                )}
              </div>
              {badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase">
                  {badge}
                </span>
              )}
            </div>
          )}

          {/* Main Description */}
          {description && (
            <p className="text-[11px] leading-relaxed text-zinc-300 font-normal">
              {description}
            </p>
          )}

          {/* Custom Node Content */}
          {content && <div className="text-[11px] text-zinc-300 mt-1">{content}</div>}

          {/* Footer / Shortcut */}
          {shortcut && (
            <div className="mt-2 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
              <span>Atalho:</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
