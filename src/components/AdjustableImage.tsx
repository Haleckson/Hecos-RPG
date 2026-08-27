import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  RotateCcw,
  Check,
  X,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HecosStorage } from '../services/storage';
import { ImageAdjustment } from '../types';

export interface AdjustableImageProps {
  src: string;
  alt?: string;
  imageKey?: string;
  className?: string;
  containerClassName?: string;
  imgClassName?: string;
  aspectRatio?: string;
  isGm?: boolean;
  onSave?: (adjustment: ImageAdjustment) => void;
  overlayGradient?: React.ReactNode;
  children?: React.ReactNode;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onClick?: (e: React.MouseEvent) => void;
  priority?: boolean;
}

export const AdjustableImage: React.FC<AdjustableImageProps> = ({
  src,
  alt = 'Imagem',
  imageKey,
  className = '',
  containerClassName = 'relative w-full h-full overflow-hidden bg-[#0c0915]',
  imgClassName = '',
  aspectRatio,
  isGm,
  onSave,
  overlayGradient,
  children,
  referrerPolicy = 'no-referrer',
  onClick,
}) => {
  const effectiveKey = imageKey || src;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // GM status
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = isGm !== undefined ? isGm : (currentUser?.role === 'gm' || HecosStorage.getGmMode());

  // Image Adjustment state
  const [savedAdjustment, setSavedAdjustment] = useState<ImageAdjustment>(() => {
    return HecosStorage.getImageAdjustment(effectiveKey) || { x: 0, y: 0, scale: 1, fitMode: 'cover' };
  });

  // Subscribe to real-time adjustments from storage / Firebase
  useEffect(() => {
    const unsub = HecosStorage.subscribeImageAdjustments((adjustments) => {
      const cleanKey = effectiveKey.trim();
      const adj = adjustments[cleanKey] || adjustments[effectiveKey];
      if (adj) {
        setSavedAdjustment(adj);
      } else if (effectiveKey === src) {
        const fallbackAdj = adjustments[src.trim()] || adjustments[src];
        if (fallbackAdj) {
          setSavedAdjustment(fallbackAdj);
        }
      }
    });
    return unsub;
  }, [effectiveKey, src]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [currentX, setCurrentX] = useState(savedAdjustment.x);
  const [currentY, setCurrentY] = useState(savedAdjustment.y);
  const [currentScale, setCurrentScale] = useState(savedAdjustment.scale || 1);
  const [currentFitMode, setCurrentFitMode] = useState<'cover' | 'contain' | 'custom'>(savedAdjustment.fitMode || 'cover');
  const [isDragging, setIsDragging] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sync edit state when opening or when savedAdjustment changes while not editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentX(savedAdjustment.x);
      setCurrentY(savedAdjustment.y);
      setCurrentScale(savedAdjustment.scale || 1);
      setCurrentFitMode(savedAdjustment.fitMode || 'cover');
    }
  }, [savedAdjustment, isEditing]);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Start drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    };
  };

  // Window drag movement and release
  useEffect(() => {
    if (!isEditing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || 300;
      const height = rect.height || 200;

      const deltaXPixels = e.clientX - dragStartRef.current.mouseX;
      const deltaYPixels = e.clientY - dragStartRef.current.mouseY;

      // Convert pixel delta to translate % in container coordinates
      const deltaXPercent = (deltaXPixels / width) * 100;
      const deltaYPercent = (deltaYPixels / height) * 100;

      const newX = Math.round((dragStartRef.current.startX + deltaXPercent) * 10) / 10;
      const newY = Math.round((dragStartRef.current.startY + deltaYPercent) * 10) / 10;

      // Generous range allowing full panning across wide or tall images without edge clipping
      setCurrentX(Math.max(-200, Math.min(200, newX)));
      setCurrentY(Math.max(-200, Math.min(200, newY)));
      setCurrentFitMode('custom');
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEditing, currentX, currentY]);

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditing || !e.touches || e.touches.length !== 1 || !e.touches[0]) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: currentX,
      startY: currentY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditing || !dragStartRef.current || !containerRef.current || !e.touches || e.touches.length !== 1 || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 200;

    const deltaXPercent = ((touch.clientX - dragStartRef.current.mouseX) / width) * 100;
    const deltaYPercent = ((touch.clientY - dragStartRef.current.mouseY) / height) * 100;

    setCurrentX(Math.max(-200, Math.min(200, Math.round((dragStartRef.current.startX + deltaXPercent) * 10) / 10)));
    setCurrentY(Math.max(-200, Math.min(200, Math.round((dragStartRef.current.startY + deltaYPercent) * 10) / 10)));
    setCurrentFitMode('custom');
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Wheel zoom handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isEditing) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
      setCurrentScale((prev) => {
        const next = Math.round(Math.max(0.15, Math.min(6.0, prev + zoomStep)) * 100) / 100;
        return next;
      });
      setCurrentFitMode('custom');
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelNative);
    };
  }, [isEditing]);

  // Keyboard shortcuts when editing (Escape to cancel, Enter to save)
  useEffect(() => {
    if (!isEditing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isEditing, currentX, currentY, currentScale, currentFitMode, savedAdjustment]);

  const stepZoom = (delta: number) => {
    setCurrentScale((prev) => Math.round(Math.max(0.15, Math.min(6.0, prev + delta)) * 100) / 100);
    setCurrentFitMode('custom');
  };

  // Save changes
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const finalAdjustment: ImageAdjustment = {
      x: currentX,
      y: currentY,
      scale: currentScale,
      fitMode: currentFitMode,
    };
    HecosStorage.saveImageAdjustment(effectiveKey, finalAdjustment);
    setSavedAdjustment(finalAdjustment);
    setIsEditing(false);
    if (onSave) onSave(finalAdjustment);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  // Cancel changes
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentX(savedAdjustment.x);
    setCurrentY(savedAdjustment.y);
    setCurrentScale(savedAdjustment.scale || 1);
    setCurrentFitMode(savedAdjustment.fitMode || 'cover');
    setIsEditing(false);
  };

  // Reset to default center & 100%
  const handleReset = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentX(0);
    setCurrentY(0);
    setCurrentScale(1);
    setCurrentFitMode('cover');
  };

  // Set to Contain Mode (100% uncropped fit)
  const handleSetContain = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentX(0);
    setCurrentY(0);
    setCurrentScale(1);
    setCurrentFitMode('contain');
  };

  // Set to Cover Mode
  const handleSetCover = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentX(0);
    setCurrentY(0);
    setCurrentScale(1);
    setCurrentFitMode('cover');
  };

  // Active transform values
  const activeX = isEditing ? currentX : savedAdjustment.x;
  const activeY = isEditing ? currentY : savedAdjustment.y;
  const activeScale = isEditing ? currentScale : (savedAdjustment.scale || 1);
  const activeFitMode = isEditing ? currentFitMode : (savedAdjustment.fitMode || 'cover');

  return (
    <div
      ref={containerRef}
      className={`group/img ${containerClassName} ${
        isEditing
          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#09070f] cursor-grab shadow-[0_0_30px_rgba(6,182,212,0.35)] select-none touch-none'
          : ''
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onMouseDown={isEditing ? handleMouseDown : undefined}
      onTouchStart={isEditing ? handleTouchStart : undefined}
      onTouchMove={isEditing ? handleTouchMove : undefined}
      onTouchEnd={isEditing ? handleTouchEnd : undefined}
      onClick={!isEditing ? onClick : (e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      {/* 
        ═══════════════════════════════════════════════════════════════════════
        ZERO-CROPPING RENDERING CANVAS:
        1. Ambient Blurred Backdrop: Provides an elegant atmospheric fill when the image
           is contained or zoomed out, preventing dead space without cropping the artwork.
        2. Flexible Transform Canvas: Scales and translates the full uncropped image
           smoothly without clipping margins.
        ═══════════════════════════════════════════════════════════════════════
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 filter blur-xl scale-125">
        <img
          src={src}
          alt=""
          aria-hidden="true"
          referrerPolicy={referrerPolicy}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${activeX}%, ${activeY}%, 0) scale(${activeScale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.08s ease-out',
        }}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy={referrerPolicy}
          className={`select-none pointer-events-none ${className}`}
          style={{
            maxWidth: activeFitMode === 'cover' ? 'none' : '100%',
            maxHeight: activeFitMode === 'cover' ? 'none' : '100%',
            width: activeFitMode === 'cover' ? '100%' : 'auto',
            height: activeFitMode === 'cover' ? '100%' : 'auto',
            objectFit: activeFitMode === 'cover' ? 'cover' : 'contain',
          }}
          draggable={false}
        />
      </div>

      {/* Optional Gradient Overlay */}
      {overlayGradient}

      {/* Children elements (e.g. badges, title overlays) */}
      <div className={`relative z-10 w-full h-full pointer-events-none ${isEditing ? 'opacity-20' : ''}`}>
        {children}
      </div>

      {/* "..." Button: visible ONLY for GM on hover in the BOTTOM RIGHT corner when NOT editing */}
      {isActualGm && !isEditing && (
        <div
          className="absolute bottom-2.5 right-2.5 z-30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            title="Ajustar posição e zoom da imagem (GM)"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/85 hover:bg-cyan-950 text-zinc-300 hover:text-cyan-300 border border-zinc-700/80 hover:border-cyan-500/80 backdrop-blur-md shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
          >
            <MoreHorizontal className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}

      {/* Active GM Gesture Mode: Floating Ultra-Compact Icon Toolbar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 right-2 z-40 flex items-center gap-1 p-1 rounded-xl bg-black/90 border border-cyan-500/80 backdrop-blur-md shadow-2xl pointer-events-auto select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => stepZoom(-0.15)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Diminuir Zoom (ou use o scroll do mouse)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span
              className="text-[10px] font-mono font-bold text-cyan-300 px-1 min-w-[32px] text-center"
              title="Nível de Zoom atual"
            >
              {Math.round(currentScale * 100)}%
            </span>

            <button
              type="button"
              onClick={() => stepZoom(0.15)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Aumentar Zoom (ou use o scroll do mouse)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Separator */}
            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />

            {/* Fit Mode Toggle (Cover / Contain) */}
            <button
              type="button"
              onClick={() => {
                if (currentFitMode === 'contain') {
                  handleSetCover();
                } else {
                  handleSetContain();
                }
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                currentFitMode === 'contain'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={currentFitMode === 'contain' ? 'Modo: Conter tudo (clique para Preencher)' : 'Modo: Preencher (clique para Conter tudo)'}
            >
              {currentFitMode === 'contain' ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Separator */}
            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />

            {/* Reset to 100% / Center */}
            <button
              type="button"
              onClick={handleReset}
              title="Restaurar posição e zoom original (100%)"
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Cancel (X) */}
            <button
              type="button"
              onClick={handleCancel}
              title="Cancelar alterações (Esc)"
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Save (Disquete / Floppy) */}
            <button
              type="button"
              onClick={handleSave}
              title="Salvar ajuste da imagem (Enter)"
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md shadow-cyan-500/30 transition-transform active:scale-90 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Save Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-cyan-300" />
            <span>Posição e Zoom salvos!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
