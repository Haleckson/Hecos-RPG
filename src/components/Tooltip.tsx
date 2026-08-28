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
  placement?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  noScroll?: boolean;
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
  side,
  placement,
  align = 'center',
  delay = 140,
  noScroll = false,
  children,
  className = '',
  disabled = false,
}) => {
  const effectiveSide = side || placement || 'top';
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; maxHeight?: number; chosenSide: string } | null>(null);
  const timerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const hasContent = Boolean(content || title || description || englishTitle);
  const isEnabled = hasContent && !disabled;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Measured exact size with fallback
    const tooltipWidth = tooltipEl ? Math.min(tooltipEl.offsetWidth, viewportW - 24) : 340;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 160;

    const spaceAbove = Math.max(0, triggerRect.top - 12);
    const spaceBelow = Math.max(0, viewportH - triggerRect.bottom - 12);

    let chosenSide = effectiveSide;

    // Auto-flip if space is insufficient
    if (effectiveSide === 'top') {
      if (spaceAbove < tooltipHeight + 10 && spaceBelow > spaceAbove) {
        chosenSide = 'bottom';
      }
    } else if (effectiveSide === 'bottom') {
      if (spaceBelow < tooltipHeight + 10 && spaceAbove > spaceBelow) {
        chosenSide = 'top';
      }
    } else if (effectiveSide === 'right') {
      if (viewportW - triggerRect.right < tooltipWidth + 12 && triggerRect.left > tooltipWidth + 12) {
        chosenSide = 'left';
      }
    } else if (effectiveSide === 'left') {
      if (triggerRect.left < tooltipWidth + 12 && viewportW - triggerRect.right > tooltipWidth + 12) {
        chosenSide = 'right';
      }
    }

    let calculatedMaxHeight: number | undefined = undefined;
    let rawTop = 0;
    let rawLeft = 0;

    if (chosenSide === 'top') {
      const availableH = spaceAbove;
      if (!noScroll && tooltipHeight > availableH) {
        calculatedMaxHeight = Math.max(120, availableH - 8);
        rawTop = triggerRect.top - (calculatedMaxHeight || tooltipHeight) - 10;
      } else {
        rawTop = triggerRect.top - tooltipHeight - 10;
      }
      rawTop = Math.min(rawTop, triggerRect.top - 10);
      rawTop = Math.max(8, rawTop);

      if (align === 'start') rawLeft = triggerRect.left;
      else if (align === 'end') rawLeft = triggerRect.right - tooltipWidth;
      else rawLeft = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
    } else if (chosenSide === 'bottom') {
      const availableH = spaceBelow;
      if (!noScroll && tooltipHeight > availableH) {
        calculatedMaxHeight = Math.max(120, availableH - 8);
      }
      rawTop = triggerRect.bottom + 10;
      rawTop = Math.max(rawTop, triggerRect.bottom + 8);

      if (align === 'start') rawLeft = triggerRect.left;
      else if (align === 'end') rawLeft = triggerRect.right - tooltipWidth;
      else rawLeft = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
    } else if (chosenSide === 'left') {
      rawLeft = triggerRect.left - tooltipWidth - 12;
      rawTop = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
      // Clamp vertical position so it stays fully inside the screen
      const maxAllowedTop = Math.max(10, viewportH - tooltipHeight - 12);
      rawTop = Math.max(10, Math.min(maxAllowedTop, rawTop));
    } else if (chosenSide === 'right') {
      rawLeft = triggerRect.right + 12;
      rawTop = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
      // Clamp vertical position so it stays fully inside the screen
      const maxAllowedTop = Math.max(10, viewportH - tooltipHeight - 12);
      rawTop = Math.max(10, Math.min(maxAllowedTop, rawTop));
    }

    // Horizontal clamping within viewport
    const clampedLeft = Math.max(10, Math.min(viewportW - tooltipWidth - 10, rawLeft));

    setCoords({
      left: Math.round(clampedLeft),
      top: Math.round(rawTop),
      maxHeight: noScroll ? undefined : calculatedMaxHeight,
      chosenSide,
    });
  }, [effectiveSide, align, noScroll]);

  const showTooltip = () => {
    if (!isEnabled) return;
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
        maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : noScroll ? 'none' : 'calc(100vh - 24px)',
        maxWidth: 'calc(100vw - 24px)',
      }}
      className={`pointer-events-auto ${noScroll ? 'overflow-visible' : 'overflow-y-auto overscroll-contain custom-scrollbar'} transition-opacity duration-150 ease-out text-left ${
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
