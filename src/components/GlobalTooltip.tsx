import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  visible: boolean;
  text: string;
  subtext?: string;
  shortcut?: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
  targetRect?: DOMRect;
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'top',
  });

  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  // Compute pixel-perfect coordinates without overlapping target or cursor
  useLayoutEffect(() => {
    if (!tooltip.visible || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const GAP = 8;
    const PADDING = 8;
    const targetRect = tooltip.targetRect;

    let left = 0;
    let top = 0;
    let placement = tooltip.placement;

    if (targetRect) {
      // If requested top but no room above, flip to bottom
      if (placement === 'top' && targetRect.top - GAP - height < PADDING) {
        placement = 'bottom';
      } else if (placement === 'bottom' && targetRect.bottom + GAP + height > window.innerHeight - PADDING) {
        placement = 'top';
      }

      if (placement === 'top') {
        left = targetRect.left + (targetRect.width - width) / 2;
        top = targetRect.top - GAP - height;
      } else if (placement === 'bottom') {
        left = targetRect.left + (targetRect.width - width) / 2;
        top = targetRect.bottom + GAP;
      } else if (placement === 'left') {
        left = targetRect.left - GAP - width;
        top = targetRect.top + (targetRect.height - height) / 2;
      } else if (placement === 'right') {
        left = targetRect.right + GAP;
        top = targetRect.top + (targetRect.height - height) / 2;
      }
    } else {
      if (placement === 'top') {
        left = tooltip.x - width / 2;
        top = tooltip.y - height;
      } else if (placement === 'bottom') {
        left = tooltip.x - width / 2;
        top = tooltip.y;
      } else if (placement === 'left') {
        left = tooltip.x - width;
        top = tooltip.y - height / 2;
      } else if (placement === 'right') {
        left = tooltip.x;
        top = tooltip.y - height / 2;
      }
    }

    // Clamp inside viewport
    const clampedLeft = Math.max(PADDING, Math.min(window.innerWidth - width - PADDING, left));
    let clampedTop = Math.max(PADDING, Math.min(window.innerHeight - height - PADDING, top));

    // Anti-overlap safeguard: if clampedTop would overlap targetRect, push away
    if (targetRect) {
      if (placement === 'top' && clampedTop + height > targetRect.top - GAP) {
        clampedTop = targetRect.top - GAP - height;
      } else if (placement === 'bottom' && clampedTop < targetRect.bottom + GAP) {
        clampedTop = targetRect.bottom + GAP;
      }
    }

    setCoords({
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop),
    });
  }, [tooltip]);

  useEffect(() => {
    const handlePointerOver = (e: PointerEvent | MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(
        '[data-tooltip], [title], [data-tip]'
      ) as HTMLElement | null;

      if (!target) {
        if (tooltip.visible) {
          hideTooltip();
        }
        return;
      }

      // Convert native title to data-tooltip to completely suppress native browser tooltips
      if (target.hasAttribute('title')) {
        const titleVal = target.getAttribute('title');
        if (titleVal && titleVal.trim()) {
          target.setAttribute('data-tooltip', titleVal);
        }
        target.removeAttribute('title');
      }

      const tooltipRaw = target.getAttribute('data-tooltip') || target.getAttribute('data-tip');
      if (!tooltipRaw || !tooltipRaw.trim()) {
        hideTooltip();
        return;
      }

      currentTargetRef.current = target;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      // Parse text and keyboard shortcut (e.g. "Salvar (Ctrl+S)")
      let text = tooltipRaw;
      let shortcut: string | undefined;
      const shortcutMatch = text.match(/\((Ctrl\+[^)]+|Alt\+[^)]+|Shift\+[^)]+|Cmd\+[^)]+|⌘[^)]+)\)/i);
      if (shortcutMatch && shortcutMatch[0] && shortcutMatch[1]) {
        shortcut = shortcutMatch[1];
        text = text.replace(shortcutMatch[0], '').trim();
      }

      const subtext = target.getAttribute('data-tooltip-subtext') || undefined;
      const requestedPlacement = (target.getAttribute('data-tooltip-placement') || 'top') as
        | 'top'
        | 'bottom'
        | 'left'
        | 'right';

      const updatePos = () => {
        if (!currentTargetRef.current) return;
        const rect = currentTargetRef.current.getBoundingClientRect();
        const padding = 8;
        let placement = requestedPlacement;

        // Auto flip if there is not enough room
        if (placement === 'top' && rect.top < 48) {
          placement = 'bottom';
        } else if (placement === 'bottom' && window.innerHeight - rect.bottom < 48) {
          placement = 'top';
        }

        let x = rect.left + rect.width / 2;
        let y = placement === 'top' ? rect.top - padding : rect.bottom + padding;

        if (placement === 'left') {
          x = rect.left - padding;
          y = rect.top + rect.height / 2;
        } else if (placement === 'right') {
          x = rect.right + padding;
          y = rect.top + rect.height / 2;
        }

        setTooltip({
          visible: true,
          text,
          subtext,
          shortcut,
          x: Math.round(x),
          y: Math.round(y),
          placement,
          targetRect: rect,
        });
      };

      if (tooltip.visible) {
        updatePos();
      } else {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = window.setTimeout(updatePos, 60);
      }
    };

    const handlePointerOut = (e: PointerEvent | MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (currentTargetRef.current && related && currentTargetRef.current.contains(related)) {
        return;
      }
      hideTooltip();
    };

    const hideTooltip = () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      currentTargetRef.current = null;
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      setCoords(null);
    };

    const handleScrollOrClick = () => {
      hideTooltip();
    };

    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    window.addEventListener('scroll', handleScrollOrClick, { passive: true, capture: true });
    window.addEventListener('click', handleScrollOrClick, { passive: true, capture: true });
    window.addEventListener('pointerdown', handleScrollOrClick, { passive: true, capture: true });
    window.addEventListener('mousedown', handleScrollOrClick, { passive: true, capture: true });

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('scroll', handleScrollOrClick, { capture: true });
      window.removeEventListener('click', handleScrollOrClick, { capture: true });
      window.removeEventListener('pointerdown', handleScrollOrClick, { capture: true });
      window.removeEventListener('mousedown', handleScrollOrClick, { capture: true });
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [tooltip.visible]);

  if (!tooltip.visible || !tooltip.text) {
    return null;
  }

  return createPortal(
    <div
      ref={tooltipRef}
      id="hecos-global-tooltip"
      className="fixed pointer-events-none transition-opacity duration-150 ease-out z-[99999999]"
      style={{
        left: coords ? `${coords.left}px` : `${tooltip.x}px`,
        top: coords ? `${coords.top}px` : `${tooltip.y}px`,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
        opacity: coords ? 1 : 0,
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Tooltip Content Box */}
        <div className="max-w-xs sm:max-w-sm px-3 py-1.5 rounded-xl bg-[#120d1c] border border-purple-500/50 text-zinc-100 shadow-[0_12px_36px_rgba(0,0,0,0.9),0_0_16px_rgba(168,85,247,0.25)] ring-1 ring-white/10 text-xs font-sans select-none">
          <div className="flex items-center gap-2 font-medium leading-relaxed tracking-wide text-zinc-200">
            <span>{tooltip.text}</span>
            {tooltip.shortcut && (
              <kbd className="px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/50 text-xs font-mono font-bold text-purple-300 shadow-inner">
                {tooltip.shortcut}
              </kbd>
            )}
          </div>
          {tooltip.subtext && (
            <div className="mt-1 text-xs text-zinc-300 font-normal leading-tight border-t border-zinc-800/80 pt-1">
              {tooltip.subtext}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
