import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content?: React.ReactNode;
  title?: string;
  englishTitle?: string;
  description?: string;
  badge?: string;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  noScroll?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  as?: 'span' | 'div' | React.ElementType;
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
  as = 'span',
}) => {
  const preferredSide = side || placement || 'auto';
  const [isVisible, setIsVisible] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    maxHeight?: number;
    maxWidth?: number;
    chosenSide: string;
  } | null>(null);

  const showTimerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const hasContent = Boolean(content || title || description || englishTitle);
  const isEnabled = hasContent && !disabled;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const PADDING = 12; // Distance from viewport edges
    const GAP = 12;     // Mandatory gap between trigger and tooltip to NEVER overlap

    // Measured natural dimensions of the tooltip
    let naturalWidth = tooltipEl ? tooltipEl.offsetWidth : 360;
    let naturalHeight = tooltipEl ? tooltipEl.offsetHeight : 200;

    if (naturalWidth <= 0) naturalWidth = 360;
    if (naturalHeight <= 0) naturalHeight = 200;

    // Available space in each direction relative to the trigger rect
    const spaceAbove = Math.max(0, triggerRect.top - PADDING - GAP);
    const spaceBelow = Math.max(0, viewportH - triggerRect.bottom - PADDING - GAP);
    const spaceLeft = Math.max(0, triggerRect.left - PADDING - GAP);
    const spaceRight = Math.max(0, viewportW - triggerRect.right - PADDING - GAP);

    // Determine the optimal placement
    let chosenSide: 'top' | 'bottom' | 'right' | 'left' = 'right';

    if (preferredSide === 'auto') {
      // For rich tooltips/cards, prefer side placement (right/left) where horizontal space is ample
      if (spaceRight >= 320) {
        chosenSide = 'right';
      } else if (spaceLeft >= 320) {
        chosenSide = 'left';
      } else if (spaceRight >= 240) {
        chosenSide = 'right';
      } else if (spaceLeft >= 240) {
        chosenSide = 'left';
      } else if (spaceBelow >= spaceAbove) {
        chosenSide = 'bottom';
      } else {
        chosenSide = 'top';
      }
    } else if (preferredSide === 'right') {
      if (spaceRight >= Math.min(naturalWidth, 260)) {
        chosenSide = 'right';
      } else if (spaceLeft >= Math.min(naturalWidth, 260)) {
        chosenSide = 'left';
      } else if (spaceBelow >= spaceAbove) {
        chosenSide = 'bottom';
      } else {
        chosenSide = 'top';
      }
    } else if (preferredSide === 'left') {
      if (spaceLeft >= Math.min(naturalWidth, 260)) {
        chosenSide = 'left';
      } else if (spaceRight >= Math.min(naturalWidth, 260)) {
        chosenSide = 'right';
      } else if (spaceBelow >= spaceAbove) {
        chosenSide = 'bottom';
      } else {
        chosenSide = 'top';
      }
    } else if (preferredSide === 'top') {
      if (spaceAbove >= naturalHeight) {
        chosenSide = 'top';
      } else if (spaceBelow >= naturalHeight) {
        chosenSide = 'bottom';
      } else if (spaceRight >= 320) {
        chosenSide = 'right';
      } else if (spaceLeft >= 320) {
        chosenSide = 'left';
      } else if (spaceAbove >= spaceBelow) {
        chosenSide = 'top';
      } else {
        chosenSide = 'bottom';
      }
    } else if (preferredSide === 'bottom') {
      if (spaceBelow >= naturalHeight) {
        chosenSide = 'bottom';
      } else if (spaceAbove >= naturalHeight) {
        chosenSide = 'top';
      } else if (spaceRight >= 320) {
        chosenSide = 'right';
      } else if (spaceLeft >= 320) {
        chosenSide = 'left';
      } else if (spaceBelow >= spaceAbove) {
        chosenSide = 'bottom';
      } else {
        chosenSide = 'top';
      }
    }

    let calculatedMaxHeight: number | undefined = undefined;
    let calculatedMaxWidth: number | undefined = undefined;
    let finalTop = 0;
    let finalLeft = 0;

    if (chosenSide === 'right') {
      // STRICT GUARANTEE: Tooltip left edge starts at triggerRect.right + GAP
      finalLeft = triggerRect.right + GAP;
      calculatedMaxWidth = Math.max(160, viewportW - (triggerRect.right + GAP) - PADDING);
      calculatedMaxHeight = Math.max(120, viewportH - 2 * PADDING);

      const actualH = Math.min(naturalHeight, calculatedMaxHeight);
      // Vertically center with trigger, but clamp strictly within viewport bounds
      const idealTop = triggerRect.top + (triggerRect.height - actualH) / 2;
      finalTop = Math.max(PADDING, Math.min(viewportH - PADDING - actualH, idealTop));
    } else if (chosenSide === 'left') {
      // STRICT GUARANTEE: Tooltip right edge ends at triggerRect.left - GAP
      calculatedMaxWidth = Math.max(160, triggerRect.left - GAP - PADDING);
      calculatedMaxHeight = Math.max(120, viewportH - 2 * PADDING);

      const actualW = Math.min(naturalWidth, calculatedMaxWidth);
      const actualH = Math.min(naturalHeight, calculatedMaxHeight);

      finalLeft = triggerRect.left - GAP - actualW;
      finalLeft = Math.max(PADDING, finalLeft);

      const idealTop = triggerRect.top + (triggerRect.height - actualH) / 2;
      finalTop = Math.max(PADDING, Math.min(viewportH - PADDING - actualH, idealTop));
    } else if (chosenSide === 'top') {
      // STRICT GUARANTEE: Tooltip bottom edge ends at triggerRect.top - GAP
      calculatedMaxHeight = Math.max(60, triggerRect.top - GAP - PADDING);
      calculatedMaxWidth = Math.max(160, viewportW - 2 * PADDING);

      const actualH = Math.min(naturalHeight, calculatedMaxHeight);
      const actualW = Math.min(naturalWidth, calculatedMaxWidth);

      finalTop = triggerRect.top - GAP - actualH;
      finalTop = Math.max(PADDING, finalTop);

      if (align === 'start') {
        finalLeft = triggerRect.left;
      } else if (align === 'end') {
        finalLeft = triggerRect.right - actualW;
      } else {
        finalLeft = triggerRect.left + (triggerRect.width - actualW) / 2;
      }
      finalLeft = Math.max(PADDING, Math.min(viewportW - PADDING - actualW, finalLeft));
    } else if (chosenSide === 'bottom') {
      // STRICT GUARANTEE: Tooltip top edge starts at triggerRect.bottom + GAP
      finalTop = triggerRect.bottom + GAP;
      calculatedMaxHeight = Math.max(60, viewportH - (triggerRect.bottom + GAP) - PADDING);
      calculatedMaxWidth = Math.max(160, viewportW - 2 * PADDING);

      const actualW = Math.min(naturalWidth, calculatedMaxWidth);

      if (align === 'start') {
        finalLeft = triggerRect.left;
      } else if (align === 'end') {
        finalLeft = triggerRect.right - actualW;
      } else {
        finalLeft = triggerRect.left + (triggerRect.width - actualW) / 2;
      }
      finalLeft = Math.max(PADDING, Math.min(viewportW - PADDING - actualW, finalLeft));
    }

    setCoords({
      left: Math.round(finalLeft),
      top: Math.round(finalTop),
      maxHeight: noScroll ? undefined : calculatedMaxHeight,
      maxWidth: calculatedMaxWidth,
      chosenSide,
    });
    setIsMeasured(true);
  }, [preferredSide, align, noScroll]);

  const showTooltip = () => {
    if (!isEnabled) return;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    showTimerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsMeasured(false);
      setCoords(null);
    }, 90);
  };

  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Measure and position whenever visibility changes or element mounts
  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  // Use ResizeObserver on tooltip element for live dynamic content updates
  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;
    const observer = new ResizeObserver(() => {
      updatePosition();
    });
    observer.observe(tooltipRef.current);
    return () => observer.disconnect();
  }, [isVisible, updatePosition]);

  // Window listeners to handle scroll or screen resize
  useEffect(() => {
    if (!isVisible) return;

    const handleScrollOrResize = () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      setIsVisible(false);
      setIsMeasured(false);
      setCoords(null);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible]);

  // Immediate dismiss on clicking trigger to ensure clean instant navigation/drawer opening
  const handleTriggerClick = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setIsVisible(false);
    setIsMeasured(false);
    setCoords(null);
  };

  const isCustomContentOnly = Boolean(content && !title && !description && !englishTitle && !badge);

  const tooltipElement = isVisible && (
    <div
      ref={tooltipRef}
      onMouseEnter={cancelHide}
      onMouseLeave={hideTooltip}
      style={{
        position: 'fixed',
        top: coords ? `${coords.top}px` : '-9999px',
        left: coords ? `${coords.left}px` : '-9999px',
        zIndex: 9999999,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
        opacity: isMeasured && coords ? 1 : 0,
        pointerEvents: isMeasured && coords ? 'auto' : 'none',
        maxHeight: coords?.maxHeight ? `${coords.maxHeight}px` : noScroll ? 'none' : 'calc(100vh - 24px)',
        maxWidth: coords?.maxWidth ? `${coords.maxWidth}px` : 'calc(100vw - 24px)',
      }}
      className={`transition-opacity duration-150 ease-out text-left ${
        noScroll ? 'overflow-visible' : 'overflow-y-auto overscroll-contain custom-scrollbar'
      } ${
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

  const Component = (as || 'span') as React.ElementType;

  return (
    <Component
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={handleTriggerClick}
      className={`inline-flex items-center ${className}`}
    >
      {children}
      {typeof document !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </Component>
  );
};

