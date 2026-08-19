import React, { useState, useEffect, useRef } from 'react';
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

  const hideTimeoutRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Intercept mouseover and pointerover globally
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

      // Parse text and keyboard shortcut (e.g. "Salvar Ancestralidade (Ctrl+S)" or "Recolher Menu (Alt+S)")
      let text = tooltipRaw;
      let shortcut: string | undefined;
      const shortcutMatch = text.match(/\((Ctrl\+[^)]+|Alt\+[^)]+|Shift\+[^)]+|Cmd\+[^)]+|⌘[^)]+)\)/i);
      if (shortcutMatch) {
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

        // Auto flip if there is not enough room on top
        if (placement === 'top' && rect.top < 46) {
          placement = 'bottom';
        } else if (placement === 'bottom' && window.innerHeight - rect.bottom < 46) {
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
          x,
          y,
          placement,
          targetRect: rect,
        });
      };

      // If already visible, switch immediately; otherwise show with a subtle 60ms delay
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
      id="hecos-global-tooltip"
      className="fixed pointer-events-none transition-opacity duration-150 ease-out z-[99999999]"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform:
          tooltip.placement === 'top'
            ? 'translate(-50%, -100%)'
            : tooltip.placement === 'bottom'
            ? 'translate(-50%, 0)'
            : tooltip.placement === 'left'
            ? 'translate(-100%, -50%)'
            : 'translate(0, -50%)',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Tooltip Content Box */}
        <div className="max-w-xs sm:max-w-sm px-3 py-1.5 rounded-xl bg-[#120d1c]/95 backdrop-blur-xl border border-purple-500/40 text-zinc-100 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_16px_rgba(168,85,247,0.25)] ring-1 ring-white/10 text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-2 font-medium leading-relaxed tracking-wide text-zinc-200">
            <span>{tooltip.text}</span>
            {tooltip.shortcut && (
              <kbd className="px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/50 text-[10px] font-mono font-bold text-purple-300 shadow-inner">
                {tooltip.shortcut}
              </kbd>
            )}
          </div>
          {tooltip.subtext && (
            <div className="mt-1 text-[11px] text-zinc-400 font-normal leading-tight border-t border-zinc-800/80 pt-1">
              {tooltip.subtext}
            </div>
          )}
        </div>

        {/* Small Arrow / Beak */}
        {tooltip.placement === 'top' && (
          <div className="w-2 h-2 bg-[#120d1c] border-r border-b border-purple-500/40 rotate-45 -mt-1 shadow-sm" />
        )}
        {tooltip.placement === 'bottom' && (
          <div className="w-2 h-2 bg-[#120d1c] border-l border-t border-purple-500/40 rotate-45 -mb-1 order-first shadow-sm" />
        )}
      </div>
    </div>,
    document.body
  );
};
