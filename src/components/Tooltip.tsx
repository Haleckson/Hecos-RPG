import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Measured exact size with fallback
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 360;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 160;

    let rawTop = 0;
    let rawLeft = 0;

    if (side === 'top') {
      rawTop = triggerRect.top - tooltipHeight - 8;
      if (align === 'start') rawLeft = triggerRect.left;
      else if (align === 'end') rawLeft = triggerRect.right - tooltipWidth;
      else rawLeft = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
    } else if (side === 'bottom') {
      rawTop = triggerRect.bottom + 8;
      if (align === 'start') rawLeft = triggerRect.left;
      else if (align === 'end') rawLeft = triggerRect.right - tooltipWidth;
      else rawLeft = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
    } else if (side === 'left') {
      rawLeft = triggerRect.left - tooltipWidth - 8;
      rawTop = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
    } else if (side === 'right') {
      rawLeft = triggerRect.right + 8;
      rawTop = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
    }

    // Flip vertically if overflowing viewport and there's more room on opposite side
    if (side === 'top' && rawTop < 12) {
      const spaceBelow = viewportH - triggerRect.bottom - 12;
      const spaceAbove = triggerRect.top - 12;
      if (spaceBelow > spaceAbove) {
        rawTop = triggerRect.bottom + 8;
      }
    } else if (side === 'bottom' && rawTop + tooltipHeight > viewportH - 12) {
      const spaceAbove = triggerRect.top - 12;
      const spaceBelow = viewportH - triggerRect.bottom - 12;
      if (spaceAbove > spaceBelow) {
        rawTop = triggerRect.top - tooltipHeight - 8;
      }
    }

    // Flip horizontally if overflowing viewport
    if (side === 'left' && rawLeft < 12) {
      rawLeft = triggerRect.right + 8;
    } else if (side === 'right' && rawLeft + tooltipWidth > viewportW - 12) {
      rawLeft = triggerRect.left - tooltipWidth - 8;
    }

    // Strict pixel-bound clamping within screen, respecting maximum viewport boundaries
    const maxAllowedTop = Math.max(12, viewportH - tooltipHeight - 12);
    const clampedLeft = Math.max(12, Math.min(viewportW - tooltipWidth - 12, rawLeft));
    const clampedTop = Math.max(12, Math.min(maxAllowedTop, rawTop));

    // Force strictly integer coordinates to avoid subpixel text anti-aliasing blur
    setCoords({
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop),
    });
  }, [side, align]);

  const showTooltip = () => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  // Recalculate exact position once DOM element is mounted or size changes
  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (!isVisible) return;

    const handleScrollOrResize = () => {
      hideTooltip();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible]);

  const isCustomContentOnly = Boolean(content && !title && !description && !englishTitle && !badge);

  const tooltipElement = isVisible && coords && (
    <div
      ref={tooltipRef}
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={hideTooltip}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 99999,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
        maxHeight: 'calc(100vh - 24px)',
        maxWidth: 'calc(100vw - 24px)',
      }}
      className={`pointer-events-auto overflow-y-auto overscroll-contain custom-scrollbar transition-opacity duration-150 ease-out text-left ${
        isCustomContentOnly
          ? 'w-auto'
          : 'max-w-xs sm:max-w-md rounded-xl p-3.5 bg-[#0d0a17] border border-zinc-700/90 shadow-[0_16px_40px_rgba(0,0,0,0.95)] ring-1 ring-white/10'
      }`}
    >
      {/* Header with Title and English/Badge */}
      {(title || englishTitle || badge) && (
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {title && <span className="font-extrabold text-xs text-amber-200">{title}</span>}
            {englishTitle && (
              <span className="text-xs text-zinc-400 font-mono italic">
                ({englishTitle})
              </span>
            )}
          </div>
          {badge && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase font-bold">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Main Description */}
      {description && (
        <p className="text-xs leading-relaxed text-zinc-200 font-normal">
          {description}
        </p>
      )}

      {/* Custom Node Content */}
      {content && (
        <div className={isCustomContentOnly ? '' : 'text-xs text-zinc-200 mt-1'}>
          {content}
        </div>
      )}

      {/* Footer / Shortcut */}
      {shortcut && (
        <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Atalho:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
            {shortcut}
          </kbd>
        </div>
      )}
    </div>
  );

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
      {typeof document !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
};
