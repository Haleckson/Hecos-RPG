import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, Award, Shield, Sparkles, Tag as TagIcon, AlertTriangle } from 'lucide-react';
import { HecosStorage } from '../services/storage';
import { getTraitInfo, TRAIT_CATEGORIES, sortTraitCategories } from '../utils/traitUtils';

export { TRAIT_CATEGORIES };

interface TraitModalProps {
  isOpen: boolean;
  onClose: () => void;
  traitName?: string | null;
  onSuccess?: () => void;
}

export const COLOR_OPTIONS = [
  { label: 'Ouro / Mecânica (Padrão)', value: 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]' },
  { label: 'Ciano / Cinética / Água', value: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  { label: 'Roxo / Etérea / Ilusão', value: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  { label: 'Verde / Biológica / Cura', value: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300' },
  { label: 'Âmbar / Abiótica / Incomum', value: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  { label: 'Rosa / Omni / Fogo Vivo', value: 'border-rose-600/80 bg-rose-950/80 text-rose-300' },
  { label: 'Azul / Raro / Abjuração', value: 'border-blue-700/80 bg-blue-950/80 text-blue-300' },
  { label: 'Teal / Ar / Tempestade', value: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  { label: 'Cinza / Comum / Geral', value: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
];

export const TraitModal: React.FC<TraitModalProps> = ({
  isOpen,
  onClose,
  traitName,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tradições de Hecos');
  const [description, setDescription] = useState('');
  const defaultColor = COLOR_OPTIONS && COLOR_OPTIONS[0] ? COLOR_OPTIONS[0].value : 'border-zinc-700 bg-zinc-900 text-zinc-300';
  const [color, setColor] = useState(defaultColor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (traitName) {
      setName(traitName);
      const info = getTraitInfo(traitName);
      setCategory(info.category || 'Mecânica PF2e / Hecos');
      setDescription(info.description || '');
      setColor(info.color || defaultColor);
    } else {
      setName('');
      setCategory('Ações e Atividades');
      setDescription('');
      setColor(defaultColor);
    }
    setShowDeleteConfirm(false);
  }, [traitName, isOpen, defaultColor]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (traitName && traitName.trim().toLowerCase() !== name.trim().toLowerCase()) {
      // Renamed trait globally in all entities!
      HecosStorage.renameTraitGlobally(traitName, name.trim());
    }

    HecosStorage.saveCustomTrait(name.trim(), {
      category,
      description,
      color,
    });

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!traitName) return;
    HecosStorage.deleteTraitGlobally(traitName);
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl bg-[#0e0a19] border border-zinc-700/80 shadow-2xl p-6 space-y-5 text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {traitName ? 'Editar Traço (Trait)' : 'Novo Traço Personalizado'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {traitName
                    ? 'Edite ou exclua este traço de todos os artigos de Hecos.'
                    : 'Cadastre um novo traço de regras e narrativa.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showDeleteConfirm ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-200">
                    Confirmar exclusão global do traço "{traitName}"?
                  </h4>
                  <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                    Esta ação removerá este traço de **todos** os artigos, ancestralidades, feitiços, itens e talentos onde ele estiver cadastrado.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/40"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sim, Excluir de Tudo</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Nome do Traço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Humanoide, Incomum, Fogo, Planar..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-amber-400 text-sm text-zinc-100 font-mono font-bold uppercase outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:border-cyan-400 outline-none"
                  >
                    {TRAIT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Estilo Visual do Badge
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:border-cyan-400 outline-none"
                  >
                    {COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Descrição & Efeito de Regra
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o impacto deste traço nas regras de PF2e ou na narrativa de Hecos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-cyan-400 text-xs text-zinc-200 leading-relaxed outline-none"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Prévia:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide uppercase border ${color}`}
                >
                  {name.trim() || 'EXEMPLO'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                {traitName ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Traço</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Traço</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
