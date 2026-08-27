import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, Tag as TagIcon, AlertTriangle } from 'lucide-react';
import { HecosStorage } from '../services/storage';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagName?: string | null;
  onSuccess?: () => void;
}

export const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  tagName,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (tagName) {
      setName(tagName);
    } else {
      setName('');
    }
    setShowDeleteConfirm(false);
  }, [tagName, isOpen]);

  if (!isOpen || !tagName) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (tagName.toLowerCase() !== name.trim().toLowerCase()) {
      HecosStorage.renameTagGlobally(tagName, name.trim());
    }

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    HecosStorage.deleteTagGlobally(tagName);
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
          className="relative w-full max-w-md rounded-2xl bg-[#0e0a19] border border-zinc-700/80 shadow-2xl p-6 space-y-5 text-zinc-100"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800/80 text-cyan-300">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Gerenciar Tag #{tagName}
                </h3>
                <p className="text-xs text-zinc-400">
                  Renomeie ou exclua esta tag em todo o Codex.
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
                    Excluir a tag "#{tagName}" de todos os artigos?
                  </h4>
                  <p className="text-xs text-rose-300/80 mt-1">
                    Esta tag será desvinculada de todos os artigos onde foi aplicada.
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
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Tag</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  Nome da Tag
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-cyan-400 font-bold">#</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/^#/, ''))}
                    placeholder="Nome da tag..."
                    className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-cyan-400 text-sm text-cyan-200 font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('hecos:open-tag-drawer', {
                          detail: { tag: tagName },
                        })
                      );
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Visualizar artigos desta tag na Gaveta Lateral"
                  >
                    <TagIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver no Painel Lateral</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-zinc-950 text-xs font-bold shadow-lg transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
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
