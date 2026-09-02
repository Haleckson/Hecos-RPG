import React, { useState, useEffect } from 'react';
import { TimelineYear, TimelineEra } from '../types';
import { X, Calendar, Sparkles, Hash, Layers, Palette, Check, Trash2 } from 'lucide-react';

interface TimelineDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (year: TimelineYear) => void;
  onDelete?: (yearId: string) => void;
  editingDate?: TimelineYear | null;
  allEras: TimelineEra[];
  presetEraId?: string;
}

const PRESET_COLORS = [
  { label: 'Ciano Ancestral', value: '#06b6d4' },
  { label: 'Roxo Cósmico', value: '#a855f7' },
  { label: 'Rosa Rubro', value: '#f43f5e' },
  { label: 'Âmbar Solar', value: '#f59e0b' },
  { label: 'Esmeralda Selvagem', value: '#10b981' },
  { label: 'Índigo Estelar', value: '#6366f1' },
  { label: 'Prata do Eclipse', value: '#94a3b8' },
];

export const TimelineDateModal: React.FC<TimelineDateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingDate,
  allEras,
  presetEraId,
}) => {
  const [title, setTitle] = useState('');
  const [eraId, setEraId] = useState('');
  const [numericOrder, setNumericOrder] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingDate) {
      setTitle(editingDate.title || '');
      setEraId(editingDate.eraId || presetEraId || (allEras[0]?.id ?? ''));
      setNumericOrder(editingDate.numericOrder ?? 0);
      setDescription(editingDate.description || '');
      setColor(editingDate.color || '#06b6d4');
    } else {
      setTitle('');
      setEraId(presetEraId || (allEras[0]?.id ?? ''));
      setNumericOrder(0);
      setDescription('');
      setColor('#06b6d4');
    }
    setShowConfirmDelete(false);
  }, [editingDate, presetEraId, isOpen, allEras]);

  // Try to parse year automatically when user types title if numericOrder was 0
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingDate && (numericOrder === 0 || numericOrder === undefined)) {
      const match = val.match(/-?\d+/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        if (!isNaN(parsed)) {
          setNumericOrder(parsed);
        }
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newYear: TimelineYear = {
      id: editingDate?.id || `year-${Date.now()}`,
      eraId: eraId || (allEras[0]?.id ?? 'era-primordial'),
      title: title.trim(),
      numericOrder: Number(numericOrder) || 0,
      description: description.trim() || undefined,
      color: color || '#06b6d4',
      createdAt: editingDate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newYear);
    onClose();
  };

  const handleDelete = () => {
    if (editingDate && onDelete) {
      onDelete(editingDate.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0c0a14] border border-zinc-800/90 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border border-zinc-700/60 shadow-inner"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}60` }}
            >
              <Calendar className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingDate ? 'Editar Ano na Timeline' : 'Adicionar Novo Ano'}
              </h2>
              <p className="text-xs text-zinc-400">
                O ano ficará no lado esquerdo da linha do tempo
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Era Assignment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Pertence à Era <span className="text-rose-500">*</span>
            </label>
            <select
              value={eraId}
              onChange={(e) => setEraId(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
            >
              {allEras.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.title}
                </option>
              ))}
            </select>
          </div>

          {/* Year Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Título do Ano <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ex: Ano 01, Ano 02, Ano -1000 ou Ano 452"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm font-semibold"
            />
          </div>

          {/* Numeric Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                Ordem Cronológica (Numérica)
              </label>
              <input
                type="number"
                value={numericOrder}
                onChange={(e) => setNumericOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Usado para ordenar automaticamente os anos dentro da Era (ex: 1, 2, 452).
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                Cor do Nó
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-zinc-700 bg-zinc-900 cursor-pointer p-0.5"
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

          {/* Presets */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Cores Predefinidas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border transition-all ${
                    color === p.value
                      ? 'border-white text-white font-semibold shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                  style={{ backgroundColor: `${p.value}15` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.value }} />
                  {p.label}
                  {color === p.value && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Year Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Resumo / Anotação Histórica do Ano
            </label>
            <textarea
              rows={2}
              placeholder="O que caracterizou este ano? Breve sumário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm resize-y"
            />
          </div>

          {/* Delete section if editing */}
          {editingDate && onDelete && (
            <div className="pt-2 border-t border-zinc-800/80">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir este Ano
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 animate-in fade-in">
                  <p className="text-xs text-rose-300">
                    Excluir este ano desvinculará suas entradas. Deseja continuar?
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

          {/* Actions */}
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
              {editingDate ? 'Salvar Alterações' : 'Adicionar Ano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
