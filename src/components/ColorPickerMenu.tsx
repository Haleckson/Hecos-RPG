import React from 'react';
import { Palette, Check } from 'lucide-react';

export interface ColorOption {
  name: string;
  color: string;
  cssClass?: string;
  style?: React.CSSProperties;
}

export const TEXT_COLORS = [
  { name: 'Padrão', value: '', label: 'Texto Padrão (Prata)', color: '#e4e4e7' },
  { name: 'Ciano Éter', value: '#00f0ff', label: 'Ciano de Hecos', color: '#00f0ff' },
  { name: 'Malva Penumbra', value: '#b877db', label: 'Malva Místico', color: '#b877db' },
  { name: 'Bordô Sangue', value: '#f43f5e', label: 'Bordô Alerta', color: '#f43f5e' },
  { name: 'Ouro Relíquia', value: '#fbbf24', label: 'Dourado / Âmbar', color: '#fbbf24' },
  { name: 'Esmeralda Ermos', value: '#34d399', label: 'Esmeralda Natureza', color: '#34d399' },
  { name: 'Cinza Sombrio', value: '#9ca3af', label: 'Cinza Discreto', color: '#9ca3af' },
  { name: 'Azul Abissal', value: '#60a5fa', label: 'Azul Arcano', color: '#60a5fa' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'Sem Realce', value: '', label: 'Transparente', bg: 'transparent', border: 'transparent' },
  { name: 'Fundo Ciano', value: 'rgba(6, 182, 212, 0.15)', label: 'Realce Ciano', bg: 'rgba(6, 182, 212, 0.25)', border: '#06b6d4' },
  { name: 'Fundo Malva', value: 'rgba(168, 85, 247, 0.18)', label: 'Realce Malva', bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7' },
  { name: 'Fundo Bordô', value: 'rgba(225, 29, 72, 0.18)', label: 'Realce Bordô', bg: 'rgba(225, 29, 72, 0.25)', border: '#e11d48' },
  { name: 'Fundo Ouro', value: 'rgba(245, 158, 11, 0.18)', label: 'Realce Ouro', bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b' },
  { name: 'Fundo Ermos', value: 'rgba(16, 185, 129, 0.18)', label: 'Realce Esmeralda', bg: 'rgba(16, 185, 129, 0.25)', border: '#10b981' },
  { name: 'Fundo Carvão', value: 'rgba(24, 24, 27, 0.8)', label: 'Realce Carvão', bg: 'rgba(39, 39, 42, 0.8)', border: '#52525b' },
];

interface ColorPickerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTextColor: (colorHex: string) => void;
  onApplyHighlight: (bgRgba: string, borderHex?: string) => void;
}

export const ColorPickerMenu: React.FC<ColorPickerMenuProps> = ({
  isOpen,
  onClose,
  onApplyTextColor,
  onApplyHighlight,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-12 left-2 z-50 w-72 p-3 rounded-xl bg-[#120e1d] border border-purple-500/40 shadow-2xl space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cores & Realces (Estilo Notion)</span>
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded bg-black/40"
        >
          ✕
        </button>
      </div>

      {/* Text Colors */}
      <div>
        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block mb-1.5">
          Cor do Texto
        </span>
        <div className="grid grid-cols-2 gap-1">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                onApplyTextColor(c.value);
                onClose();
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-700"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span style={{ color: c.value || '#e4e4e7' }} className="font-medium truncate">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Highlight Backgrounds */}
      <div className="pt-2 border-t border-zinc-800/80">
        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block mb-1.5">
          Fundo / Realce (Highlight)
        </span>
        <div className="grid grid-cols-2 gap-1">
          {HIGHLIGHT_COLORS.map((h) => (
            <button
              key={h.name}
              type="button"
              onClick={() => {
                onApplyHighlight(h.value, h.border);
                onClose();
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-700"
            >
              <span
                className="w-3.5 h-3.5 rounded border shadow-sm shrink-0"
                style={{ backgroundColor: h.bg, borderColor: h.border }}
              />
              <span className="text-zinc-300 font-medium truncate">{h.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
