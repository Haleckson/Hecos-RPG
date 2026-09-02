import React, { useState, useEffect } from 'react';
import { TimelineEra } from '../types';
import { X, Sparkles, Layers, Palette, Check, Hash, Trash2 } from 'lucide-react';

interface TimelineEraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (era: TimelineEra) => void;
  onDelete?: (eraId: string) => void;
  editingEra?: TimelineEra | null;
}

const PRESET_COLORS = [
  { label: 'Púrpura Cósmico', value: '#a855f7' },
  { label: 'Rubro Eclipse', value: '#be123c' },
  { label: 'Ciano Arcano', value: '#00f0ff' },
  { label: 'Esmeralda Mística', value: '#10b981' },
  { label: 'Âmbar Solar', value: '#f59e0b' },
  { label: 'Índigo Profundo', value: '#6366f1' },
  { label: 'Prata Lunar', value: '#94a3b8' },
];

export const TimelineEraModal: React.FC<TimelineEraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingEra,
}) => {
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#a855f7');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingEra) {
      setTitle(editingEra.title || '');
      setOrder(editingEra.order ?? 1);
      setDescription(editingEra.description || '');
      setColor(editingEra.color || '#a855f7');
    } else {
      setTitle('');
      setOrder(1);
      setDescription('');
      setColor('#a855f7');
    }
    setShowConfirmDelete(false);
  }, [editingEra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: TimelineEra = {
      id: editingEra?.id || `era-${Date.now()}`,
      title: title.trim(),
      order: Number(order) || 1,
      description: description.trim() || undefined,
      color: color || '#a855f7',
      createdAt: editingEra?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (editingEra && onDelete) {
      onDelete(editingEra.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0c0a14] border border-zinc-800/90 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border border-zinc-700/60 shadow-inner"
              style={{ backgroundColor: `${color}25`, borderColor: `${color}80` }}
            >
              <Layers className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingEra ? 'Editar Era da História' : 'Nova Era da Linha do Tempo'}
              </h2>
              <p className="text-xs text-zinc-400">
                Divisória horizontal principal que quebra a linha do tempo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Era Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Título da Era <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ex: ERA 01 • Os Deuses Primordiais ou ERA 01"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm font-medium"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Este título aparecerá em destaque na divisória horizontal da timeline.
            </p>
          </div>

          {/* Era Order Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                Ordem da Era
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Sequência de exibição (1, 2, 3...)
              </p>
            </div>

            {/* Theme Color Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                Cor da Divisória
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-900 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Cores Predefinidas de Hecos
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    color === p.value
                      ? 'border-white text-white font-semibold shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                  style={{ backgroundColor: `${p.value}15` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.value }} />
                  {p.label}
                  {color === p.value && <Check className="w-3 h-3 ml-0.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Era Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Descrição / Contexto da Era
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o contexto geral, atmosfera e acontecimentos que definiram esta época..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm resize-y"
            />
          </div>

          {/* Live Preview of Era Divider */}
          <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Prévia da Divisória Horizontal:
            </span>
            <div className="relative flex items-center justify-center my-3">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div
                  className="w-full border-t border-dashed"
                  style={{ borderColor: `${color}60` }}
                />
              </div>
              <div
                className="relative flex items-center gap-2 px-5 py-1.5 rounded-full border shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: '#090812',
                  borderColor: `${color}90`,
                  boxShadow: `0 0 20px ${color}30`,
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-100">
                  {title || 'ERA 01 • NOME DA ERA'}
                </span>
              </div>
            </div>
          </div>

          {/* Delete section if editing */}
          {editingEra && onDelete && (
            <div className="pt-2 border-t border-zinc-800/80">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir esta Era
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 animate-in fade-in">
                  <p className="text-xs text-rose-300">
                    Tem certeza? Os anos e entradas pertencentes a esta Era serão realocados.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 20px ${color}40`,
              }}
            >
              <Check className="w-4 h-4" />
              {editingEra ? 'Salvar Alterações' : 'Criar Era'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
