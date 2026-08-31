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
  delay = 120,
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
    chosenSide: string;
  } | null>(null);

  const showTimerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const hasContent = Boolean(content || title || description || englishTitle);
  const isEnabled = hasContent && !disabled;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const PADDING = 12; // Safety margin from viewport boundaries
    const GAP = 10;     // Spacing between trigger and tooltip box

    // Natural dimensions measured directly from the DOM
    const naturalWidth = tooltipEl.offsetWidth || 280;
    const naturalHeight = tooltipEl.offsetHeight || 100;

    // Available space around trigger
    const spaceAbove = triggerRect.top - PADDING - GAP;
    const spaceBelow = viewportH - triggerRect.bottom - PADDING - GAP;
    const spaceLeft = triggerRect.left - PADDING - GAP;
    const spaceRight = viewportW - triggerRect.right - PADDING - GAP;

    // Determine optimal placement side
    let chosenSide: 'top' | 'bottom' | 'right' | 'left' = 'right';

    if (preferredSide === 'auto') {
      // Prioritize right or left if width fits, otherwise top or bottom with most space
      if (spaceRight >= naturalWidth) {
        chosenSide = 'right';
      } else if (spaceLeft >= naturalWidth) {
        chosenSide = 'left';
      } else if (spaceBelow >= naturalHeight) {
        chosenSide = 'bottom';
      } else if (spaceAbove >= naturalHeight) {
        chosenSide = 'top';
      } else {
        // Pick the side with the maximum available dimension
        const maxSpace = Math.max(spaceRight, spaceLeft, spaceBelow, spaceAbove);
        if (maxSpace === spaceRight) chosenSide = 'right';
        else if (maxSpace === spaceLeft) chosenSide = 'left';
        else if (maxSpace === spaceBelow) chosenSide = 'bottom';
        else chosenSide = 'top';
      }
    } else if (preferredSide === 'right') {
      if (spaceRight >= naturalWidth || spaceRight >= spaceLeft) {
        chosenSide = 'right';
      } else {
        chosenSide = 'left';
      }
    } else if (preferredSide === 'left') {
      if (spaceLeft >= naturalWidth || spaceLeft >= spaceRight) {
        chosenSide = 'left';
      } else {
        chosenSide = 'right';
      }
    } else if (preferredSide === 'top') {
      if (spaceAbove >= naturalHeight || spaceAbove >= spaceBelow) {
        chosenSide = 'top';
      } else {
        chosenSide = 'bottom';
      }
    } else if (preferredSide === 'bottom') {
      if (spaceBelow >= naturalHeight || spaceBelow >= spaceAbove) {
        chosenSide = 'bottom';
      } else {
        chosenSide = 'top';
      }
    }

    let finalTop = 0;
    let finalLeft = 0;

    if (chosenSide === 'right') {
      finalLeft = triggerRect.right + GAP;
      // Vertically center with trigger, clamped strictly within viewport bounds
      const idealTop = triggerRect.top + (triggerRect.height - naturalHeight) / 2;
      finalTop = idealTop;
    } else if (chosenSide === 'left') {
      finalLeft = triggerRect.left - GAP - naturalWidth;
      const idealTop = triggerRect.top + (triggerRect.height - naturalHeight) / 2;
      finalTop = idealTop;
    } else if (chosenSide === 'top') {
      finalTop = triggerRect.top - GAP - naturalHeight;
      if (align === 'start') {
        finalLeft = triggerRect.left;
      } else if (align === 'end') {
        finalLeft = triggerRect.right - naturalWidth;
      } else {
        finalLeft = triggerRect.left + (triggerRect.width - naturalWidth) / 2;
      }
    } else if (chosenSide === 'bottom') {
      finalTop = triggerRect.bottom + GAP;
      if (align === 'start') {
        finalLeft = triggerRect.left;
      } else if (align === 'end') {
        finalLeft = triggerRect.right - naturalWidth;
      } else {
        finalLeft = triggerRect.left + (triggerRect.width - naturalWidth) / 2;
      }
    }

    // Strict clamping within viewport boundaries so the entire tooltip is always 100% visible
    const clampedMaxLeft = viewportW - naturalWidth - PADDING;
    const clampedLeft = Math.max(PADDING, Math.min(clampedMaxLeft, finalLeft));

    const clampedMaxTop = viewportH - naturalHeight - PADDING;
    const clampedTop = Math.max(PADDING, Math.min(clampedMaxTop, finalTop));

    setCoords({
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop),
      chosenSide,
    });
    setIsMeasured(true);
  }, [preferredSide, align]);

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
    }, 80);
  };

  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;
    const observer = new ResizeObserver(() => {
      updatePosition();
    });
    observer.observe(tooltipRef.current);
    return () => observer.disconnect();
  }, [isVisible, updatePosition]);

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

  const handleTriggerClick = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setIsVisible(false);
    setIsMeasured(false);
    setCoords(null);
  };

  const isStructured = Boolean(title || description || englishTitle || badge || shortcut);
  const isStringContent = typeof content === 'string' || typeof content === 'number';

  // Dynamic width class based on content length
  const descriptionLength = (description || '').length + (typeof content === 'string' ? content.length : 0);
  const dynamicWidthClass = descriptionLength > 300
    ? 'w-[480px] max-w-[calc(100vw-28px)]'
    : descriptionLength > 140
    ? 'w-[380px] max-w-[calc(100vw-28px)]'
    : 'w-auto max-w-[320px]';

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
        overflow: 'visible', // NEVER have scrolls
      }}
      className="transition-opacity duration-150 ease-out text-left select-none overflow-visible"
    >
      {isStructured ? (
        <div className={`${dynamicWidthClass} rounded-xl p-3.5 bg-[#0d0a17] border border-purple-500/40 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-white/10 overflow-visible`}>
          {/* Header with Title and English/Badge */}
          {(title || englishTitle || badge) && (
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {title && <span className="font-extrabold text-xs text-amber-200 break-words">{title}</span>}
                {englishTitle && (
                  <span className="text-xs text-zinc-400 font-mono italic break-words">
                    ({englishTitle})
                  </span>
                )}
              </div>
              {badge && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase font-bold shrink-0 whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
          )}

          {/* Main Description (Never clipped, never scrollable) */}
          {description && (
            <p className="text-xs leading-relaxed text-zinc-200 font-normal break-words whitespace-normal">
              {description}
            </p>
          )}

          {/* Custom Node Content */}
          {content && (
            <div className="text-xs text-zinc-200 mt-1 break-words whitespace-normal overflow-visible">
              {content}
            </div>
          )}

          {/* Footer / Shortcut */}
          {shortcut && (
            <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Atalho:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-600/50 text-purple-200 whitespace-nowrap">
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      ) : isStringContent ? (
        <div className="max-w-[340px] px-3 py-2 rounded-xl bg-[#120d1c] border border-purple-500/50 text-zinc-100 shadow-[0_12px_36px_rgba(0,0,0,0.9),0_0_16px_rgba(168,85,247,0.25)] ring-1 ring-white/10 text-xs font-medium font-sans leading-relaxed tracking-wide backdrop-blur-md break-words whitespace-normal overflow-visible">
          {content}
        </div>
      ) : (
        <div className="w-auto max-w-[calc(100vw-28px)] overflow-visible">
          {content}
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
