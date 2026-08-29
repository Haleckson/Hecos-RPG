import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, HelpCircle, X, AlertTriangle, Wand2, Layers } from 'lucide-react';
import { HecosStorage } from '../services/storage';
import { getTraitInfo } from '../utils/traitUtils';

export interface TraitBadgeProps {
  trait: string;
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  interactive?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  compact?: boolean;
  showTooltip?: boolean;
}

export const TraitBadge: React.FC<TraitBadgeProps> = ({
  trait,
  className = '',
  onClick,
  onRemove,
  removable = false,
  interactive = true,
  size = 'md',
  compact = false,
  showTooltip = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [version, setVersion] = useState(0);

  const clean = trait ? trait.trim() : '';

  useEffect(() => {
    const unsub = HecosStorage.subscribeTraits(() => {
      setVersion((v) => v + 1);
    });
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('hecos:traits-updated', handleUpdate);
    return () => {
      unsub();
      window.removeEventListener('hecos:traits-updated', handleUpdate);
    };
  }, []);

  const info = useMemo(() => {
    return getTraitInfo(clean);
  }, [clean, version]);

  const isActuallyRemovable = removable || Boolean(onRemove);

  const sizeClass = compact || size === 'xs'
    ? 'px-1.5 py-0.5 rounded text-[9.5px] leading-tight font-mono font-bold tracking-tight uppercase'
    : size === 'sm'
    ? 'px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-mono font-bold tracking-tight uppercase'
    : size === 'lg'
    ? 'px-2.5 py-1 rounded-lg text-xs leading-normal font-mono font-bold tracking-wider uppercase'
    : 'px-2 py-0.5 rounded-md text-[11px] leading-tight font-mono font-bold tracking-wide uppercase';

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (showConfirmDelete || !showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipH = 150;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    let targetY = rect.bottom + 8;
    if (spaceBelow < tooltipH && spaceAbove > spaceBelow) {
      targetY = rect.top - tooltipH - 8;
    }

    const targetX = rect.left + rect.width / 2 - 140;

    setHoverPos({
      x: Math.max(12, Math.min(window.innerWidth - 300, targetX)),
      y: Math.max(8, Math.min(window.innerHeight - tooltipH - 8, targetY)),
    });
    setIsHovered(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      window.dispatchEvent(
        new CustomEvent('hecos:open-trait-drawer', {
          detail: { trait: clean },
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovered(false);
    setShowConfirmDelete(true);
  };

  const handleConfirmRemoval = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(false);
    if (onRemove) {
      onRemove();
    }
  };

  const handleCancelRemoval = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(false);
  };

  return (
    <>
      <span className="relative inline-flex items-center group/trait-badge">
        <span
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={interactive ? handleClick : undefined}
          onKeyDown={interactive ? handleKeyDown : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovered(false)}
          className={`inline-flex items-center gap-1.5 border transition-all ${sizeClass} ${
            interactive ? 'cursor-pointer shadow-sm hover:scale-[1.03] active:scale-95' : 'cursor-default select-none'
          } ${info.color} ${className}`}
          data-tooltip-ignore="true"
        >
          <span>{clean}</span>

          {isActuallyRemovable && (
            <span
              onClick={handleRemoveClick}
              role="button"
              tabIndex={0}
              className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-rose-950/90 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title={`Remover traço ${clean} desta entidade`}
            >
              <X className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </span>

        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {isHovered && !showConfirmDelete && showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 2, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[9999] w-72 max-w-[85vw] p-3.5 rounded-xl bg-[#0d0918]/95 backdrop-blur-md border border-amber-600/50 shadow-2xl text-left pointer-events-none"
                  style={{
                    top: hoverPos.y,
                    left: hoverPos.x,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5 mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1">
                      {info.isTradition ? <Wand2 className="w-3 h-3 text-cyan-300" /> : <Layers className="w-3 h-3 text-amber-400" />}
                      <span>Traço • {info.category}</span>
                    </span>
                    <span className="text-xs font-bold text-amber-300 font-serif uppercase tracking-wide">
                      {clean}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {info.description || 'Traço temático ou de regras de Hecos.'}
                  </p>
                  {interactive && (
                    <div className="mt-2 pt-1.5 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between">
                      <span className="text-zinc-500 font-mono">Clique para abrir painel</span>
                      <span className="text-amber-400 font-mono font-semibold">PF2e / Hecos</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </span>

      {/* Confirmation Modal for Trait Removal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={handleCancelRemoval}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#120e1d] border border-rose-600/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/50">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-100">Remover Traço</h4>
                  <p className="text-xs text-zinc-400">Confirmação de alteração</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Deseja remover o traço <strong className="text-amber-300 font-mono uppercase bg-black/40 px-1.5 py-0.5 rounded border border-zinc-800">"{clean}"</strong> desta entidade?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleCancelRemoval}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoval}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Confirmar Remoção</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

