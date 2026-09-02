import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  defaultHeight?: number;
  minAllowedHeight?: number;
  maxAllowedHeight?: number;
  label?: string;
  showControls?: boolean;
  containerClassName?: string;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(({
  defaultHeight = 160,
  minAllowedHeight = 80,
  maxAllowedHeight = 1200,
  label,
  showControls = true,
  containerClassName = '',
  className = '',
  style,
  rows,
  ...props
}, ref) => {
  const [currentHeight, setCurrentHeight] = useState<number>(defaultHeight);
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Expose innerRef to external forwarded ref
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  useEffect(() => {
    if (defaultHeight && defaultHeight > 0) {
      setCurrentHeight((prev) => Math.max(prev, defaultHeight));
    }
  }, [defaultHeight]);

  const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startHeightRef.current = innerRef.current?.clientHeight || currentHeight;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = moveY - startYRef.current;
      const newHeight = Math.max(minAllowedHeight, Math.min(maxAllowedHeight, startHeightRef.current + deltaY));
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  };

  const handleExpand = () => {
    setCurrentHeight((prev) => Math.min(maxAllowedHeight, prev + 100));
  };

  const handleShrink = () => {
    setCurrentHeight((prev) => Math.max(minAllowedHeight, prev - 80));
  };

  const handleReset = () => {
    setCurrentHeight(defaultHeight);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {(label || showControls) && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          {label && <label className="font-semibold text-zinc-200">{label}</label>}
          {showControls && (
            <div className="ml-auto flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handleShrink}
                title="Diminuir altura (-80px)"
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors text-[10px] font-mono font-bold"
              >
                -80px
              </button>
              <span className="text-zinc-600 text-[9px]">•</span>
              <button
                type="button"
                onClick={handleExpand}
                title="Aumentar altura (+100px)"
                className="px-1.5 py-0.5 rounded hover:bg-cyan-950 hover:text-cyan-300 text-cyan-400 transition-colors text-[10px] font-mono font-bold"
              >
                +100px
              </button>
              <span className="text-zinc-600 text-[9px]">•</span>
              <button
                type="button"
                onClick={handleReset}
                title="Redefinir altura padrão"
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200 text-zinc-500 transition-colors text-[10px]"
              >
                Padrão
              </button>
            </div>
          )}
        </div>
      )}

      <div className="relative group w-full">
        <textarea
          ref={innerRef}
          style={{
            ...style,
            minHeight: `${currentHeight}px`,
            height: `${currentHeight}px`,
          }}
          className={`w-full p-3 pr-24 pb-7 bg-zinc-900/90 border border-zinc-700/80 rounded-t-xl rounded-b-none text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/90 focus:ring-1 focus:ring-cyan-500/50 text-sm leading-relaxed resize-y selection:bg-purple-900/50 transition-colors ${className}`}
          {...props}
        />

        {/* Highly Accessible Corner Resize Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeMouseDown}
          onDoubleClick={() => setCurrentHeight((prev) => (prev > 240 ? defaultHeight : 380))}
          title="Atalho de Redimensionamento: Arraste para ajustar a altura da caixa de texto (ou duplo clique para alternar tamanho)"
          className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0a1c]/95 border border-cyan-500/80 hover:border-cyan-400 active:border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:shadow-[0_0_16px_rgba(6,182,212,0.7)] cursor-ns-resize select-none z-10 transition-all hover:scale-105"
        >
          <span className="text-[9px] font-mono font-bold text-cyan-300 tracking-tight uppercase mr-0.5">
            ⇕ Redimensionar
          </span>
          <div className="flex flex-col gap-0.5 items-end">
            <div className="w-3.5 h-0.5 bg-cyan-300 rounded-full" />
            <div className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
            <div className="w-1.5 h-0.5 bg-purple-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Horizontal Drag Bar & Quick Presets */}
      <div
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeMouseDown}
        onDoubleClick={() => setCurrentHeight((prev) => (prev > 240 ? defaultHeight : 380))}
        title="Barra de Redimensionamento: Arraste para ajustar a altura ou escolha um preset"
        className="w-full -mt-1.5 py-1 px-2.5 rounded-b-xl bg-zinc-950/90 border-x border-b border-zinc-700/80 hover:border-cyan-500/70 flex items-center justify-between gap-1.5 cursor-ns-resize select-none text-[9px] font-mono text-zinc-400 group transition-all"
      >
        <div className="flex items-center gap-1 text-cyan-400/80 group-hover:text-cyan-300">
          <span className="font-bold">⠿</span>
          <span className="uppercase text-[8px] tracking-wider">
            Arraste ({currentHeight}px)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentHeight(120);
            }}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            120px
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentHeight(240);
            }}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            240px
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentHeight(400);
            }}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            400px
          </button>
        </div>
      </div>
    </div>
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';
